import re
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.medium")

class MediumConnector(BaseConnector):
    """
    Medium Publication & Articles Connector.
    Uses public Medium author RSS/HTML endpoints to discover published engineering,
    data science, and architecture articles without scraping private content.
    """

    FEED_URL = "https://medium.com/feed"

    def __init__(self):
        super().__init__(platform_name="Medium", reliability=0.90)
        self.client = httpx.AsyncClient(
            timeout=8.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "application/xml,text/xml,*/*;q=0.8"
            }
        )
        self.last_status = "connected"
        self.last_error: Optional[str] = None

    async def close(self):
        await self.client.aclose()

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _extract_username(self, text: str) -> Optional[str]:
        clean = text.strip()
        match = re.search(r'(?:https?://)?(?:www\.)?medium\.com/@?([a-zA-Z0-9_\-]+)', clean)
        if match:
            return match.group(1).rstrip('/')
        if clean.startswith("@"):
            return clean.lstrip("@").strip()
        if re.match(r'^[a-zA-Z0-9_\-]{3,30}$', clean) and " " not in clean:
            return clean
        return None

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Fetch Medium author publications feed."""
        username = self._extract_username(identifier)
        if not username:
            return None

        # Exclude reserved medium tags/paths
        if username.lower() in ("tag", "topic", "membership", "creators", "policy", "about"):
            return None

        url = f"{self.FEED_URL}/@{username}"
        profile_url = f"https://medium.com/@{username}"

        try:
            res = await self.client.get(url)
            if res.status_code == 404:
                self.last_status = "empty"
                return None
            if res.status_code != 200:
                self.last_status = "unavailable"
                self.last_error = f"Medium HTTP {res.status_code}"
                return None

            xml = res.text
            if "<title>" not in xml or "Page not found" in xml:
                self.last_status = "empty"
                return None

            # Extract author title and items
            title_match = re.search(r'<title><!\[CDATA\[(.*?)\]\]></title>', xml) or re.search(r'<title>(.*?)</title>', xml)
            author_title = title_match.group(1) if title_match else f"@{username}"
            clean_author = author_title.replace("Stories by ", "").replace(" on Medium", "").strip()

            # Extract articles
            activities: List[NormalizedActivity] = []
            items = re.findall(r'<item>(.*?)</item>', xml, re.DOTALL)
            for idx, item in enumerate(items[:6]):
                item_title_match = re.search(r'<title><!\[CDATA\[(.*?)\]\]></title>', item) or re.search(r'<title>(.*?)</title>', item)
                item_link_match = re.search(r'<link>(.*?)</link>', item)
                item_date_match = re.search(r'<pubDate>(.*?)</pubDate>', item)

                if item_title_match:
                    t = item_title_match.group(1).strip()
                    link = item_link_match.group(1).strip() if item_link_match else profile_url
                    date_str = item_date_match.group(1) if item_date_match else str(datetime.now().year)

                    activities.append(
                        NormalizedActivity(
                            id=f"act_med_{username}_{idx}",
                            category="Publication",
                            title=t,
                            description=f"Medium article published by {clean_author}",
                            organization="Medium",
                            date=date_str[:16],
                            source_url=link,
                            source_platform="Medium",
                            confidence=0.90,
                            metadata={"author": clean_author}
                        )
                    )

            self.last_status = "complete"
            return NormalizedSource(
                source_id=f"src_med_{username}",
                platform="Medium",
                source_type="publication_author",
                profile_id=username,
                username=username,
                display_name=clean_author,
                avatar_url=None,
                organization=None,
                bio=f"Medium Writer & Technical Author | Published {len(activities)} articles",
                links=[profile_url],
                activities=activities,
                projects=[],
                source_url=profile_url,
                retrieved_at=self._now_iso(),
                freshness="active",
                reliability=0.90,
                status="success"
            )

        except Exception as e:
            self.last_status = "failed"
            self.last_error = str(e)
            logger.error(f"Medium fetch error for {username}: {e}")
            return None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []

    async def search(self, query: str) -> List[NormalizedSource]:
        prof = await self.get_profile(query)
        return [prof] if prof else []
