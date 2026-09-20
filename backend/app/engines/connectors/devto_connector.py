import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.devto")

class DevToConnector(BaseConnector):
    """Dev.to public API connector for technical publications, articles, and profiles."""

    def __init__(self):
        super().__init__(platform_name="Dev.to", reliability=0.88)
        self.client = httpx.AsyncClient(timeout=7.0, follow_redirects=True)
        self.last_status = "connected"
        self.last_error: Optional[str] = None

    async def close(self):
        await self.client.aclose()

    def _format_timestamp(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        clean_user = identifier.strip().lstrip("@")
        if not clean_user:
            return None

        # Dev.to articles by username
        url = f"https://dev.to/api/articles?username={clean_user}&per_page=5"
        try:
            res = await self.client.get(url)
            if res.status_code == 200:
                articles = res.json()
                if isinstance(articles, list) and len(articles) > 0:
                    first = articles[0]
                    user_info = first.get("user", {})
                    author_name = user_info.get("name") or clean_user

                    activities: List[NormalizedActivity] = []
                    for idx, a in enumerate(articles):
                        pub_date = a.get("published_at", "")[:10]
                        activities.append(
                            NormalizedActivity(
                                id=f"act_devto_{clean_user}_{idx}",
                                category="Publications",
                                title=a.get("title", "Technical Article"),
                                description=a.get("description") or f"Published on Dev.to by @{clean_user}",
                                organization="Dev.to",
                                date=pub_date[:7] if pub_date else "2025-01",
                                source_url=a.get("url", f"https://dev.to/{clean_user}"),
                                source_platform="Dev.to",
                                confidence=0.88,
                                metadata={
                                    "tags": a.get("tag_list", []),
                                    "reactions": a.get("public_reactions_count", 0),
                                    "reading_time": a.get("reading_time_minutes", 0)
                                }
                            )
                        )

                    self.last_status = "complete"
                    return NormalizedSource(
                        source_id=f"src_devto_{clean_user}",
                        platform="Dev.to",
                        source_type="profile",
                        profile_id=clean_user,
                        username=clean_user,
                        display_name=author_name,
                        avatar_url=user_info.get("profile_image"),
                        bio=f"Technical author on Dev.to with {len(articles)} verified publications.",
                        links=[f"https://dev.to/{clean_user}"],
                        activities=activities,
                        projects=[],
                        source_url=f"https://dev.to/{clean_user}",
                        retrieved_at=self._format_timestamp(),
                        freshness="active",
                        reliability=self.reliability,
                        status="success"
                    )
                else:
                    self.last_status = "empty"
                    return None
            else:
                self.last_status = "empty"
                return None
        except Exception as e:
            self.last_status = "failed"
            self.last_error = str(e)
            return None

    async def search(self, query: str) -> List[NormalizedSource]:
        prof = await self.get_profile(query)
        return [prof] if prof else []

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []
