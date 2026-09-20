import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.hackernews")

class HackerNewsConnector(BaseConnector):
    """Algolia HackerNews index connector for public technical discussions & submissions."""

    def __init__(self):
        super().__init__(platform_name="HackerNews", reliability=0.82)
        self.client = httpx.AsyncClient(timeout=7.0, follow_redirects=True)
        self.last_status = "connected"
        self.last_error: Optional[str] = None

    async def close(self):
        await self.client.aclose()

    def _format_timestamp(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def search(self, query: str) -> List[NormalizedSource]:
        clean_q = query.strip().lstrip("@")
        if not clean_q:
            return []

        url = f"https://hn.algolia.com/api/v1/search?query={clean_q}&tags=(story,author_{clean_q})&hitsPerPage=4"
        try:
            res = await self.client.get(url)
            if res.status_code == 200:
                hits = res.json().get("hits", [])
                if not hits:
                    self.last_status = "empty"
                    return []

                activities: List[NormalizedActivity] = []
                for idx, h in enumerate(hits):
                    title = h.get("title") or h.get("story_title") or "HackerNews Discussion"
                    created = h.get("created_at", "")[:10]
                    target_url = h.get("url") or f"https://news.ycombinator.com/item?id={h.get('objectID')}"
                    activities.append(
                        NormalizedActivity(
                            id=f"act_hn_{clean_q}_{idx}",
                            category="Publications",
                            title=title,
                            description=f"HackerNews discussion by/mentioning {h.get('author', clean_q)} ({h.get('points', 0)} points)",
                            organization="Y Combinator HackerNews",
                            date=created[:7] if created else "2024-06",
                            source_url=target_url,
                            source_platform="HackerNews",
                            confidence=0.82,
                            metadata={"points": h.get("points", 0), "comments": h.get("num_comments", 0)}
                        )
                    )

                self.last_status = "complete"
                return [
                    NormalizedSource(
                        source_id=f"src_hn_{clean_q}",
                        platform="HackerNews",
                        source_type="mention",
                        profile_id=clean_q,
                        username=clean_q,
                        display_name=f"HN @{clean_q}",
                        bio=f"HackerNews presence with {len(activities)} indexed technical submissions.",
                        links=[f"https://news.ycombinator.com/user?id={clean_q}"],
                        activities=activities,
                        projects=[],
                        source_url=f"https://news.ycombinator.com/user?id={clean_q}",
                        retrieved_at=self._format_timestamp(),
                        freshness="active",
                        reliability=self.reliability,
                        status="success"
                    )
                ]
            else:
                self.last_status = "unavailable"
                self.last_error = f"HN Algolia search HTTP {res.status_code}"
                return []
        except Exception as e:
            self.last_status = "failed"
            self.last_error = str(e)
            return []

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        results = await self.search(identifier)
        return results[0] if results else None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []
