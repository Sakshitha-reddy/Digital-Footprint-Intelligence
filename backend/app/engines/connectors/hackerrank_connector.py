import re
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.hackerrank")

class HackerRankConnector(BaseConnector):
    """
    HackerRank Developer Identity Connector.
    Uses public HackerRank profile endpoints to retrieve public badges,
    algorithmic problem-solving scores, school, country, and contest activity.
    """

    PROFILE_API = "https://www.hackerrank.com/rest/hackers"

    def __init__(self):
        super().__init__(platform_name="HackerRank", reliability=0.90)
        self.client = httpx.AsyncClient(
            timeout=8.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
                "Accept": "application/json"
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
        match = re.search(r'(?:https?://)?(?:www\.)?hackerrank\.com/(?:profile/)?([a-zA-Z0-9_\-]+)', clean)
        if match:
            return match.group(1).rstrip('/')
        if clean.startswith("@"):
            return clean.lstrip("@").strip()
        if re.match(r'^[a-zA-Z0-9_\-]{3,30}$', clean) and " " not in clean:
            return clean
        return None

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Fetch HackerRank user details and public badges."""
        username = self._extract_username(identifier)
        if not username:
            return None

        url = f"{self.PROFILE_API}/{username}/profile"
        badges_url = f"{self.PROFILE_API}/{username}/badges"

        try:
            res = await self.client.get(url)
            if res.status_code == 404:
                self.last_status = "empty"
                return None
            if res.status_code != 200:
                self.last_status = "unavailable"
                self.last_error = f"HackerRank HTTP {res.status_code}"
                return None

            data = res.json().get("model", {})
            if not data:
                self.last_status = "empty"
                return None

            display_name = data.get("name") or data.get("username") or username
            bio = data.get("short_bio") or data.get("about")
            avatar_url = data.get("avatar")
            country = data.get("country")
            school = data.get("school")
            website = data.get("website")

            # Fetch badges if available
            activities: List[NormalizedActivity] = []
            skills_found = []
            try:
                b_res = await self.client.get(badges_url)
                if b_res.status_code == 200:
                    badge_models = b_res.json().get("models", [])
                    for b in badge_models:
                        badge_name = b.get("badge_name")
                        stars = b.get("stars", 0)
                        if badge_name:
                            skills_found.append(f"{badge_name} ({stars}★)")
                            activities.append(
                                NormalizedActivity(
                                    id=f"act_hr_{b.get('badge_type', 'skill')}_{username}",
                                    category="Skill Certification",
                                    title=f"{badge_name} - {stars} Stars",
                                    description=f"HackerRank verified skill badge with {stars} stars",
                                    organization=school or "HackerRank",
                                    date=str(datetime.now().year),
                                    source_url=f"https://www.hackerrank.com/profile/{username}",
                                    source_platform="HackerRank",
                                    confidence=0.92,
                                    metadata={"stars": stars, "badge_name": badge_name}
                                )
                            )
            except Exception as e:
                logger.debug(f"HackerRank badge fetch failed: {e}")

            summary_bio = bio or ""
            if skills_found:
                skills_str = ", ".join(skills_found[:4])
                summary_bio = f"{summary_bio} | Badges: {skills_str}".strip(" |")

            self.last_status = "complete"
            return NormalizedSource(
                source_id=f"src_hr_{username}",
                platform="HackerRank",
                source_type="competitive_profile",
                profile_id=username,
                username=username,
                display_name=display_name,
                avatar_url=avatar_url,
                organization=school,
                location=country,
                website=website,
                bio=summary_bio,
                links=[f"https://www.hackerrank.com/profile/{username}"],
                activities=activities,
                projects=[],
                source_url=f"https://www.hackerrank.com/profile/{username}",
                retrieved_at=self._now_iso(),
                freshness="active",
                reliability=0.90,
                status="success"
            )

        except Exception as e:
            self.last_status = "failed"
            self.last_error = str(e)
            logger.error(f"HackerRank fetch error for {username}: {e}")
            return None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []

    async def search(self, query: str) -> List[NormalizedSource]:
        prof = await self.get_profile(query)
        return [prof] if prof else []

