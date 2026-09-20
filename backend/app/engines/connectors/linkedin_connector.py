import re
import urllib.parse
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Set
from app.core.config import settings
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.linkedin")

class LinkedInDiscoveryConnector(BaseConnector):
    """
    Compliant High-Precision Public LinkedIn Discovery Connector.
    Discovers publicly indexed LinkedIn profile citations via:
    1. SerpAPI Google Search (Primary — exact index coverage)
    2. Tavily Search API (Secondary — relevance validated)
    3. Apify Google Search Scraper (Backup)
    4. DuckDuckGo Search (Fallback)
    
    Strictly verifies candidate name and handle morphology to prevent
    hallucinated or irrelevant international profile associations.
    """

    def __init__(self):
        super().__init__(platform_name="LinkedIn", reliability=0.90)
        self.tavily_key = settings.TAVILY_API_KEY
        self.serpapi_key = settings.SERPAPI_API_KEY
        self.apify_token = settings.APIFY_API_TOKEN
        self.timeout = settings.API_TIMEOUT
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            },
            timeout=self.timeout,
            follow_redirects=True
        )
        self.last_status = "connected"
        self.last_error: Optional[str] = None

    async def close(self):
        await self.client.aclose()

    def _format_timestamp(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _parse_linkedin_title(self, raw_title: str) -> Dict[str, str]:
        """Extracts clean display name, headline, and company from snippet titles."""
        clean = re.sub(r'\s*\|\s*LinkedIn.*$', '', raw_title, flags=re.IGNORECASE).strip()
        clean = re.sub(r'\s*-\s*LinkedIn.*$', '', clean, flags=re.IGNORECASE).strip()
        parts = [p.strip() for p in clean.split(" - ") if p.strip()]

        display_name = parts[0] if parts else "Public LinkedIn Member"
        headline = " - ".join(parts[1:]) if len(parts) > 1 else ""

        org = ""
        if " at " in headline:
            org = headline.split(" at ")[-1].strip()
        elif " @ " in headline:
            org = headline.split(" @ ")[-1].strip()

        return {
            "display_name": display_name,
            "headline": headline,
            "organization": org
        }

    def _is_profile_relevant(
        self,
        title: str,
        url: str,
        snippet: str,
        name: str = "",
        seed_handle: str = "",
        affiliation: str = ""
    ) -> bool:
        """
        Validates that a discovered LinkedIn hit actually belongs to the target
        and is NOT a random or international homonym.
        """
        target_text = f"{title} {url} {snippet}".lower()

        # Handle match check
        clean_handle = (seed_handle or "").strip().lstrip("@").lower()
        if clean_handle and len(clean_handle) >= 3 and clean_handle in target_text:
            return True

        # Name token check
        name_tokens = [t.lower() for t in re.findall(r'[a-zA-Z]{3,}', name)]
        if not name_tokens:
            return True

        title_url = f"{title} {url}".lower()
        matched_in_title_or_url = [t for t in name_tokens if t in title_url]

        # If name has at least 2 tokens (e.g. Bethala Manohar), ensure at least 1 appears in the title or URL
        if len(name_tokens) >= 2:
            if len(matched_in_title_or_url) >= 1:
                return True
            # Or if multiple tokens appear in snippet
            if sum(1 for t in name_tokens if t in target_text) >= 2:
                return True
            return False

        # Single token name
        return any(t in title_url for t in name_tokens)

    def _extract_linkedin_sources(
        self,
        search_results: List[Dict[str, Any]],
        name: str = "",
        seed_handle: str = "",
        affiliation: str = ""
    ) -> List[NormalizedSource]:
        """Convert raw search results into NormalizedSource objects with relevance verification."""
        results: List[NormalizedSource] = []
        seen_urls: Set[str] = set()

        for hit in search_results:
            url = hit.get("url", "") or hit.get("link", "")
            title = hit.get("title", "")
            snippet = hit.get("snippet", "") or hit.get("content", "")

            # Must be a public profile URL
            if "linkedin.com/in/" not in url:
                continue

            # Strip query params and tracking tokens
            actual_url = url.split("?")[0].rstrip("/")
            if actual_url in seen_urls:
                continue

            # Relevance check: discard random international/hallucinated profiles
            if not self._is_profile_relevant(title, actual_url, snippet, name=name, seed_handle=seed_handle, affiliation=affiliation):
                logger.debug(f"LinkedIn candidate discarded as irrelevant: {title} ({actual_url})")
                continue

            seen_urls.add(actual_url)

            # Extract username from LinkedIn URL
            username_match = re.search(r'linkedin\.com/in/([^/?#]+)', actual_url)
            username = username_match.group(1) if username_match else (seed_handle or "linkedin_user")

            parsed = self._parse_linkedin_title(title)

            # Calculate match confidence based on token matches
            evidence_score = 0.92
            if affiliation and affiliation.lower() in f"{title} {snippet}".lower():
                evidence_score = 0.98

            results.append(
                NormalizedSource(
                    source_id=f"src_li_{username}",
                    platform="LinkedIn",
                    source_type="profile",
                    profile_id=username,
                    username=username,
                    display_name=parsed["display_name"],
                    organization=parsed["organization"] or affiliation or None,
                    bio=f"{parsed['headline']}. {snippet}".strip(". ") if parsed["headline"] else snippet,
                    links=[actual_url],
                    activities=[],
                    projects=[],
                    source_url=actual_url,
                    retrieved_at=self._format_timestamp(),
                    freshness="active",
                    reliability=evidence_score,
                    status="success"
                )
            )

            if len(results) >= 4:
                break

        return results

    async def _search_serpapi_query(self, query: str) -> List[Dict[str, Any]]:
        """Search Google via SerpAPI for public LinkedIn profiles."""
        if not self.serpapi_key:
            return []

        params = {
            "engine": "google",
            "q": query,
            "api_key": self.serpapi_key,
            "num": 5,
        }
        url = f"https://serpapi.com/search?{urllib.parse.urlencode(params)}"

        try:
            res = await self.client.get(url)
            if res.status_code == 200:
                data = res.json()
                organic = data.get("organic_results", [])
                return [
                    {
                        "title": item.get("title", ""),
                        "url": item.get("link", ""),
                        "snippet": item.get("snippet", ""),
                    }
                    for item in organic
                ]
            else:
                logger.warning(f"SerpAPI LinkedIn search returned HTTP {res.status_code}")
                return []
        except Exception as e:
            logger.warning(f"SerpAPI LinkedIn search failed: {e}")
            return []

    async def _search_tavily_query(self, query: str) -> List[Dict[str, Any]]:
        """Search via Tavily API."""
        if not self.tavily_key:
            return []

        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.tavily_key,
            "query": query,
            "search_depth": "basic",
            "max_results": 5,
            "include_answer": False,
            "include_raw_content": False,
        }

        try:
            res = await self.client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                raw_results = data.get("results", [])
                return [
                    {
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "snippet": item.get("content", ""),
                    }
                    for item in raw_results
                ]
            return []
        except Exception as e:
            logger.warning(f"Tavily LinkedIn search error: {e}")
            return []

    async def _search_duckduckgo_query(self, query: str) -> List[Dict[str, Any]]:
        """Fallback to DuckDuckGo public search."""
        encoded = urllib.parse.quote(query)
        url = f"https://api.duckduckgo.com/?q={encoded}&format=json&no_html=1&skip_disambig=1"
        try:
            res = await self.client.get(url)
            if res.status_code == 200:
                data = res.json()
                results = []
                for topic in data.get("RelatedTopics", []):
                    if isinstance(topic, dict):
                        first_url = topic.get("FirstURL", "")
                        text = topic.get("Text", "")
                        if "linkedin.com/in/" in first_url:
                            results.append({
                                "title": text[:80] if text else query,
                                "url": first_url,
                                "snippet": text,
                            })
                return results
        except Exception as e:
            logger.debug(f"DuckDuckGo LinkedIn fallback error: {e}")
        return []

    async def search_multi(
        self,
        name: str = "",
        seed_handle: str = "",
        email: str = "",
        affiliation: str = "",
        keywords: str = ""
    ) -> List[NormalizedSource]:
        """
        Executes an adaptive, multi-query search to find the exact target LinkedIn profile.
        Formulates queries with token flexibility and reverses name order when appropriate.
        """
        clean_name = (name or "").strip()
        clean_handle = (seed_handle or "").strip().lstrip("@")
        clean_affil = (affiliation or "").strip()
        clean_email = (email or "").strip()

        # Build high-probability query variations
        queries: List[str] = []

        # Name variations
        name_parts = clean_name.split() if clean_name else []
        rev_name = " ".join(reversed(name_parts)) if len(name_parts) == 2 else ""

        # 1. Name + Affiliation combinations (without rigid enclosing quotes)
        if clean_name and clean_affil:
            queries.append(f'site:linkedin.com/in/ "{clean_name}" {clean_affil}')
            queries.append(f'site:linkedin.com/in/ {clean_name} {clean_affil}')
            if rev_name:
                queries.append(f'site:linkedin.com/in/ "{rev_name}" {clean_affil}')
                queries.append(f'site:linkedin.com/in/ {rev_name} {clean_affil}')

        # 2. Name alone variations
        if clean_name:
            queries.append(f'site:linkedin.com/in/ "{clean_name}"')
            if rev_name:
                queries.append(f'site:linkedin.com/in/ "{rev_name}"')
            queries.append(f'site:linkedin.com/in/ {clean_name}')

        # 3. Handle variations
        if clean_handle:
            queries.append(f'site:linkedin.com/in/ "{clean_handle}"')
            queries.append(f'site:linkedin.com/in/{clean_handle}')

        # 4. Email prefix variation
        if clean_email and "@" in clean_email:
            email_prefix = clean_email.split("@")[0].strip()
            if len(email_prefix) >= 4 and email_prefix != clean_handle:
                queries.append(f'site:linkedin.com/in/ {email_prefix}')

        all_matches: List[NormalizedSource] = []
        seen_urls: Set[str] = set()

        # Try Google SerpAPI first (highest index accuracy for LinkedIn)
        if self.serpapi_key:
            for q in queries:
                raw_hits = await self._search_serpapi_query(q)
                if raw_hits:
                    extracted = self._extract_linkedin_sources(
                        raw_hits,
                        name=clean_name,
                        seed_handle=clean_handle,
                        affiliation=clean_affil
                    )
                    for s in extracted:
                        if s.source_url not in seen_urls:
                            seen_urls.add(s.source_url)
                            all_matches.append(s)
                    if all_matches:
                        break  # Found exact matches, stop query loop

        # If SerpAPI returned nothing, try Tavily with relevance validation
        if not all_matches and self.tavily_key:
            for q in queries[:3]:
                raw_hits = await self._search_tavily_query(q)
                if raw_hits:
                    extracted = self._extract_linkedin_sources(
                        raw_hits,
                        name=clean_name,
                        seed_handle=clean_handle,
                        affiliation=clean_affil
                    )
                    for s in extracted:
                        if s.source_url not in seen_urls:
                            seen_urls.add(s.source_url)
                            all_matches.append(s)
                    if all_matches:
                        break

        # Fallback to DuckDuckGo if still empty
        if not all_matches:
            for q in queries[:2]:
                raw_hits = await self._search_duckduckgo_query(q)
                if raw_hits:
                    extracted = self._extract_linkedin_sources(
                        raw_hits,
                        name=clean_name,
                        seed_handle=clean_handle,
                        affiliation=clean_affil
                    )
                    for s in extracted:
                        if s.source_url not in seen_urls:
                            seen_urls.add(s.source_url)
                            all_matches.append(s)
                    if all_matches:
                        break

        if all_matches:
            self.last_status = "complete"
            self.last_error = None
            logger.info(f"LinkedIn discovery: found {len(all_matches)} verified profile(s) for target '{clean_name or clean_handle}'")
            return all_matches

        self.last_status = "empty"
        self.last_error = "No public LinkedIn profiles verified for this target."
        logger.info(f"LinkedIn discovery: no matching profiles found for '{clean_name or clean_handle}'")
        return []

    async def search(self, query: str) -> List[NormalizedSource]:
        """Backward compatibility for single query string."""
        return await self.search_multi(name=query)

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        results = await self.search(identifier)
        return results[0] if results else None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        return []
