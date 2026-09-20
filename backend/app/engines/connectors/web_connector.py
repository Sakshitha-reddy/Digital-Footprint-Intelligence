import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.web")

class WebSearchConnector(BaseConnector):
    """DuckDuckGo Instant Answer and public open web connector for domain and entity validation."""

    def __init__(self):
        super().__init__(platform_name="Web", reliability=0.85)
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

        url = f"https://api.duckduckgo.com/?q={clean_q}&format=json&no_html=1&skip_disambig=1"
        try:
            res = await self.client.get(url)
            if res.status_code == 200:
                data = res.json()
                abstract = data.get("AbstractText")
                source_url = data.get("AbstractURL")
                heading = data.get("Heading")

                if abstract and source_url:
                    self.last_status = "complete"
                    return [
                        NormalizedSource(
                            source_id=f"src_web_{heading[:15]}",
                            platform="Web",
                            source_type="article",
                            profile_id=heading,
                            username=heading,
                            display_name=heading,
                            organization=data.get("AbstractSource"),
                            bio=abstract,
                            links=[source_url],
                            activities=[],
                            projects=[],
                            source_url=source_url,
                            retrieved_at=self._format_timestamp(),
                            freshness="active",
                            reliability=self.reliability,
                            status="success"
                        )
                    ]
                else:
                    self.last_status = "empty"
                    return []
            else:
                self.last_status = "unavailable"
                self.last_error = f"DuckDuckGo HTTP {res.status_code}"
                return []
        except Exception as e:
            self.last_status = "failed"
            self.last_error = str(e)
            return []

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        res = await self.search(identifier)
        return res[0] if res else None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        return []
