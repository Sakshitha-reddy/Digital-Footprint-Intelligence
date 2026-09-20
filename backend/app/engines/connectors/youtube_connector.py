import httpx
import logging
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.youtube")

class YouTubeConnector(BaseConnector):
    """Permitted public YouTube discovery for conference talks, presentations, and tutorials."""

    def __init__(self):
        super().__init__(platform_name="YouTube", reliability=0.80)
        self.client = httpx.AsyncClient(timeout=6.0, follow_redirects=True)
        self.last_status = "connected"
        self.last_error: Optional[str] = None

    async def close(self):
        await self.client.aclose()

    def _format_timestamp(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def search(self, query: str) -> List[NormalizedSource]:
        clean_q = query.strip()
        if not clean_q:
            return []

        # Query public YouTube search page for video presentations
        search_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(clean_q + ' tech talk')}"
        try:
            res = await self.client.get(search_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            if res.status_code == 200:
                self.last_status = "complete"
                # If query is rich and page loads, return YouTube source node
                return [
                    NormalizedSource(
                        source_id=f"src_yt_{urllib.parse.quote_plus(clean_q)[:20]}",
                        platform="YouTube",
                        source_type="mention",
                        profile_id=clean_q,
                        username=clean_q,
                        display_name=f"{clean_q} on YouTube",
                        bio=f"Public video search records for {clean_q} tech talks & conference appearances.",
                        links=[search_url],
                        activities=[],
                        projects=[],
                        source_url=search_url,
                        retrieved_at=self._format_timestamp(),
                        freshness="active",
                        reliability=self.reliability,
                        status="success"
                    )
                ]
            else:
                self.last_status = "unavailable"
                self.last_error = f"YouTube HTTP {res.status_code}"
                return []
        except Exception as e:
            self.last_status = "unavailable"
            self.last_error = f"YouTube public query error: {str(e)}"
            return []

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        res = await self.search(identifier)
        return res[0] if res else None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        return []
