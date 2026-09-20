import time
import httpx
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings

logger = logging.getLogger("neurax.search_provider")

class SearchCache:
    """Simple in-memory TTL cache for web search queries to prevent rate-limit burning."""
    def __init__(self, ttl_seconds: int = 600):
        self.ttl = ttl_seconds
        self._cache: Dict[str, Tuple[float, List[Dict[str, Any]]]] = {}

    def get(self, key: str) -> Optional[List[Dict[str, Any]]]:
        if key in self._cache:
            ts, val = self._cache[key]
            if time.time() - ts < self.ttl:
                return val
            del self._cache[key]
        return None

    def set(self, key: str, val: List[Dict[str, Any]]):
        self._cache[key] = (time.time(), val)


class PublicSearchProvider:
    """
    Public web search provider adapter with primary (Tavily) and fallback (DuckDuckGo) strategies.
    Strictly discovers publicly accessible index entries.
    Never circumvents authentication or retrieves private data.
    """

    def __init__(self):
        self.api_key = settings.TAVILY_API_KEY
        self.timeout = settings.API_TIMEOUT
        self.max_results = settings.MAX_SEARCH_RESULTS
        self.cache = SearchCache(ttl_seconds=600)
        self.last_provider_used = "tavily" if self.api_key else "duckduckgo"
        self.last_status = "available" if self.api_key else "fallback"
        self.last_error: Optional[str] = None

    async def search(self, query: str, max_results: Optional[int] = None) -> List[Dict[str, Any]]:
        clean_q = query.strip()
        if not clean_q:
            return []

        limit = max_results or self.max_results
        cache_key = f"{clean_q}::{limit}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            logger.info(f"Search cache hit for query: '{clean_q}'")
            return cached

        # 1. Attempt Tavily if API key is configured
        if self.api_key:
            try:
                results = await self._search_tavily(clean_q, limit)
                if results:
                    self.last_provider_used = "tavily"
                    self.last_status = "available"
                    self.last_error = None
                    self.cache.set(cache_key, results)
                    return results
            except Exception as e:
                logger.warning(f"Tavily search failed or rate-limited ({e}), trying Apify Google Scraper.")
                self.last_error = str(e)

        # 2. Attempt Apify Google Search Scraper if Apify token is configured
        if settings.APIFY_API_TOKEN:
            try:
                results = await self._search_apify_google(clean_q, limit)
                if results:
                    self.last_provider_used = "apify_google"
                    self.last_status = "available"
                    self.last_error = None
                    self.cache.set(cache_key, results)
                    return results
            except Exception as e:
                logger.warning(f"Apify Google Search failed ({e}), falling back to DuckDuckGo.")
                self.last_error = str(e)

        # 3. Fallback to DuckDuckGo public search
        self.last_provider_used = "duckduckgo"
        try:
            results = await self._search_duckduckgo(clean_q, limit)
            self.last_status = "fallback" if not self.api_key else "available"
            self.cache.set(cache_key, results)
            return results
        except Exception as e:
            self.last_status = "unavailable"
            self.last_error = f"All search providers failed: {e}"
            logger.error(self.last_error)
            return []

    async def _search_tavily(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Queries Tavily Search API with retries and timeout control."""
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": "basic",
            "max_results": limit,
            "include_answer": False,
            "include_raw_content": False,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(2):
                try:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        raw_results = data.get("results", [])
                        normalized = []
                        for item in raw_results:
                            normalized.append({
                                "title": item.get("title") or "Web Discovery Result",
                                "url": item.get("url", ""),
                                "snippet": item.get("content") or "",
                                "source": "Tavily Web Search",
                                "published_date": item.get("published_date") or None
                            })
                        return normalized
                    elif res.status_code in (401, 403):
                        self.last_status = "unauthorized"
                        raise RuntimeError("Tavily API key is invalid or unauthorized.")
                    elif res.status_code == 429:
                        self.last_status = "rate_limited"
                        raise RuntimeError("Tavily API rate limit exceeded.")
                    else:
                        raise RuntimeError(f"Tavily API returned HTTP {res.status_code}")
                except httpx.TimeoutException:
                    if attempt == 1:
                        raise RuntimeError(f"Tavily search timed out after {self.timeout}s.")
                except Exception as ex:
                    if attempt == 1:
                        raise ex

        return []

    async def _search_duckduckgo(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """DuckDuckGo public search fallback."""
        url = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1"
        normalized = []
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                abstract = data.get("AbstractText")
                url_res = data.get("AbstractURL")
                heading = data.get("Heading")
                if abstract and url_res:
                    normalized.append({
                        "title": heading or query,
                        "url": url_res,
                        "snippet": abstract,
                        "source": "DuckDuckGo Public Index",
                        "published_date": None
                    })

                # Check RelatedTopics
                for topic in data.get("RelatedTopics", [])[:limit]:
                    if isinstance(topic, dict) and "Text" in topic and "FirstURL" in topic:
                        normalized.append({
                            "title": topic.get("Text", "")[:60],
                            "url": topic.get("FirstURL", ""),
                            "snippet": topic.get("Text", ""),
                            "source": "DuckDuckGo Topic Index",
                            "published_date": None
                        })

        return normalized[:limit]

    async def _search_apify_google(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """
        Queries Apify Google Search Results Scraper (Actor: apify/google-search-scraper, ID: nFJndFXA5zjCTuudP).
        Extracts verified organic Google search results, personalInfo, and descriptions.
        """
        token = settings.APIFY_API_TOKEN
        if not token:
            return []

        actor_url = f"https://api.apify.com/v2/acts/nFJndFXA5zjCTuudP/run-sync-get-dataset-items?token={token}&timeout=25"
        payload = {
            "queries": query,
            "maxPagesPerQuery": 1,
            "resultsPerPage": min(limit, 10),
            "mobileResults": False
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(actor_url, json=payload, headers={"Content-Type": "application/json"})
            if res.status_code in (200, 201):
                items = res.json()
                if not items or not isinstance(items, list):
                    return []

                first_dataset_item = items[0]
                organic = first_dataset_item.get("organicResults", [])
                normalized: List[Dict[str, Any]] = []

                for r in organic[:limit]:
                    title = r.get("title") or "Google Result"
                    url = r.get("url") or ""
                    desc = r.get("description") or ""

                    # Check personalInfo if Google extracted LinkedIn/Author details
                    personal = r.get("personalInfo", {})
                    if personal and personal.get("rawText"):
                        desc = f"{personal['rawText']} — {desc}" if desc else personal["rawText"]

                    if url:
                        normalized.append({
                            "title": title,
                            "url": url,
                            "snippet": desc,
                            "source": "Google (via Apify)",
                            "published_date": None
                        })

                return normalized
            else:
                logger.warning(f"Apify Google Search scraper returned HTTP {res.status_code}")
                return []


# Global singleton instance
search_provider = PublicSearchProvider()
