import httpx
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("neurax.rag_browser")

class RAGWebBrowserService:
    """
    Integration with Apify Actor: apify/rag-web-browser.
    Crawls and converts web search results and target profiles directly
    into structured Markdown context suitable for LLM RAG pipelines.
    """

    ACTOR_ID = "apify~rag-web-browser"

    def __init__(self):
        self.api_token = settings.APIFY_API_TOKEN
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)

    async def close(self):
        await self.client.aclose()

    async def browse_query_to_markdown(self, query: str, max_results: int = 3) -> str:
        """
        Executes web search via Apify RAG Web Browser and returns aggregated Markdown context.
        """
        if not self.api_token:
            logger.debug("Apify API token not configured; skipping RAG browser.")
            return ""

        url = f"https://api.apify.com/v2/acts/{self.ACTOR_ID}/run-sync-get-dataset-items?token={self.api_token}&timeout=25"
        payload = {
            "query": query,
            "maxResults": max_results,
        }

        try:
            logger.info(f"Running Apify RAG Web Browser for '{query}'...")
            res = await self.client.post(url, json=payload, headers={"Content-Type": "application/json"})
            if res.status_code not in (200, 201):
                logger.warning(f"RAG Web Browser returned HTTP {res.status_code}")
                return ""

            items = res.json()
            if not items or not isinstance(items, list):
                return ""

            markdown_chunks = []
            for item in items:
                search_res = item.get("searchResult", {})
                title = search_res.get("title") or item.get("metadata", {}).get("title", "")
                url_found = search_res.get("url") or item.get("metadata", {}).get("url", "")
                md = item.get("markdown") or item.get("text", "")

                if md and len(md.strip()) > 20:
                    markdown_chunks.append(f"### [{title}]({url_found})\n{md[:1200].strip()}\n")
                elif search_res.get("description"):
                    markdown_chunks.append(f"### [{title}]({url_found})\n{search_res.get('description')}\n")

            return "\n---\n".join(markdown_chunks)

        except Exception as e:
            logger.warning(f"Error during Apify RAG Web Browser execution: {e}")
            return ""

    async def browse_url_to_markdown(self, target_url: str) -> Optional[str]:
        """Fetches a specific webpage and converts it to clean Markdown."""
        if not self.api_token or not target_url:
            return None

        url = f"https://api.apify.com/v2/acts/{self.ACTOR_ID}/run-sync-get-dataset-items?token={self.api_token}&timeout=25"
        payload = {
            "query": target_url,
            "maxResults": 1,
        }

        try:
            res = await self.client.post(url, json=payload, headers={"Content-Type": "application/json"})
            if res.status_code in (200, 201):
                items = res.json()
                if items and isinstance(items, list):
                    return items[0].get("markdown") or items[0].get("text")
            return None
        except Exception as e:
            logger.warning(f"Failed to scrape URL {target_url} via RAG Web Browser: {e}")
            return None

# Global singleton
rag_browser = RAGWebBrowserService()
