import httpx
import logging
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.wikimedia")

class WikimediaConnector(BaseConnector):
    """
    Public Wikimedia & Wikipedia Knowledge Graph Connector.
    Discovers publicly indexed encyclopedic and notability records
    using the official MediaWiki Action API.
    """

    def __init__(self):
        super().__init__(platform_name="Wikimedia", reliability=0.92)
        self.client = httpx.AsyncClient(
            headers={"User-Agent": "AporiaTrace-OSINT/3.0 (compliance@aporia-trace.ai)"},
            timeout=settings.API_TIMEOUT,
            follow_redirects=True
        )
        self.last_status = "connected"

    async def close(self):
        await self.client.aclose()

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def search(self, query: str) -> List[NormalizedSource]:
        clean_q = query.strip()
        if not clean_q:
            return []

        url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(clean_q)}&format=json&utf8=1&srlimit=2"
        try:
            res = await self.client.get(url)
            if res.status_code == 200:
                data = res.json()
                search_hits = data.get("query", {}).get("search", [])
                results: List[NormalizedSource] = []

                for item in search_hits:
                    title = item.get("title", "")
                    pageid = item.get("pageid", "")
                    snippet = item.get("snippet", "").replace('<span class="searchmatch">', '').replace('</span>', '')
                    page_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"

                    results.append(
                        NormalizedSource(
                            source_id=f"src_wiki_{pageid}",
                            platform="Wikimedia",
                            source_type="public_record",
                            profile_id=str(pageid),
                            username=title,
                            display_name=title,
                            bio=snippet,
                            links=[page_url],
                            activities=[],
                            projects=[],
                            source_url=page_url,
                            retrieved_at=self._now_iso(),
                            freshness="active",
                            reliability=self.reliability,
                            status="success"
                        )
                    )
                self.last_status = "complete" if results else "empty"
                return results
        except Exception as e:
            logger.warning(f"Wikimedia search failed: {e}")
            self.last_status = "failed"
        return []

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        hits = await self.search(identifier)
        return hits[0] if hits else None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        return []
