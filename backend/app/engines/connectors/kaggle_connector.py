import re
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.kaggle")

class KaggleConnector(BaseConnector):
    """
    Kaggle Data Science & ML Identity Connector.
    Discovers public Kaggle tier (Grandmaster, Master, Expert, Contributor),
    competitions, datasets, and notebook activities.
    """

    BASE_URL = "https://www.kaggle.com"

    def __init__(self):
        super().__init__(platform_name="Kaggle", reliability=0.88)
        self.client = httpx.AsyncClient(
            timeout=8.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
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
        match = re.search(r'(?:https?://)?(?:www\.)?kaggle\.com/([a-zA-Z0-9_\-]+)', clean)
        if match:
            return match.group(1).rstrip('/')
        if clean.startswith("@"):
            return clean.lstrip("@").strip()
        if re.match(r'^[a-zA-Z0-9_\-]{3,30}$', clean) and " " not in clean:
            return clean
        return None

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Fetch Kaggle public profile."""
        username = self._extract_username(identifier)
        if not username:
            return None

        # Exclude reserved kaggle paths
        if username.lower() in ("competitions", "datasets", "code", "discussions", "learn", "models", "docs"):
            return None

        url = f"{self.BASE_URL}/{username}"
        try:
            res = await self.client.get(url)
            if res.status_code == 404:
                self.last_status = "empty"
                return None
            if res.status_code != 200:
                self.last_status = "unavailable"
                self.last_error = f"Kaggle HTTP {res.status_code}"
                return None

            html = res.text
            if "Page Not Found" in html or "user does not exist" in html.lower():
                self.last_status = "empty"
                return None

            # Extract user title/tier & display name from OpenGraph or JSON-LD
            name_match = re.search(r'<meta property="og:title" content="([^"]+)"', html)
            desc_match = re.search(r'<meta property="og:description" content="([^"]+)"', html)
            img_match = re.search(r'<meta property="og:image" content="([^"]+)"', html)

            raw_name = name_match.group(1) if name_match else username
            display_name = raw_name.replace(" | Kaggle", "").strip()
            bio = desc_match.group(1) if desc_match else f"Kaggle Machine Learning Competitor @{username}"
            avatar_url = img_match.group(1) if img_match else None

            # Extract tier if present
            tier = "Contributor"
            for t in ["Grandmaster", "Master", "Expert", "Novice", "Contributor"]:
                if t.lower() in html.lower():
                    tier = t
                    break

            activities = [
                NormalizedActivity(
                    id=f"act_kg_{username}",
                    category="Machine Learning Activity",
                    title=f"Kaggle {tier}",
                    description=bio[:200],
                    organization="Kaggle Data Science",
                    date=str(datetime.now().year),
                    source_url=url,
                    source_platform="Kaggle",
                    confidence=0.88,
                    metadata={"tier": tier}
                )
            ]

            self.last_status = "complete"
            return NormalizedSource(
                source_id=f"src_kg_{username}",
                platform="Kaggle",
                source_type="competitive_profile",
                profile_id=username,
                username=username,
                display_name=display_name,
                avatar_url=avatar_url,
                organization=None,
                bio=f"{bio} | Kaggle Tier: {tier}",
                links=[url],
                activities=activities,
                projects=[],
                source_url=url,
                retrieved_at=self._now_iso(),
                freshness="active",
                reliability=0.88,
                status="success"
            )

        except Exception as e:
            self.last_status = "failed"
            self.last_error = str(e)
            logger.error(f"Kaggle fetch error for {username}: {e}")
            return None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []

    async def search(self, query: str) -> List[NormalizedSource]:
        prof = await self.get_profile(query)
        return [prof] if prof else []
