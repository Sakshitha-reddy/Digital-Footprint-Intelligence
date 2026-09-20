import re
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.stackoverflow")

class StackOverflowConnector(BaseConnector):
    """
    Stack Overflow Developer Identity Connector.
    Uses official Stack Exchange public REST API (2.3) to retrieve public developer reputation,
    reputation rank, gold/silver/bronze badges, and top answers.
    """

    API_URL = "https://api.stackexchange.com/2.3/users"

    def __init__(self):
        super().__init__(platform_name="Stack Overflow", reliability=0.92)
        self.client = httpx.AsyncClient(
            timeout=8.0,
            follow_redirects=True,
            headers={"User-Agent": "NEURAX-Intelligence-Engine/1.0"}
        )
        self.last_status = "connected"
        self.last_error: Optional[str] = None

    async def close(self):
        await self.client.aclose()

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _extract_user_id(self, text: str) -> Optional[str]:
        clean = text.strip()
        match = re.search(r'stackoverflow\.com/users/([0-9]+)', clean)
        if match:
            return match.group(1)
        if clean.isdigit():
            return clean
        return None

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Fetch Stack Overflow user by ID or exact username search."""
        uid = self._extract_user_id(identifier)
        clean = identifier.strip().lstrip("@")

        try:
            if uid:
                url = f"{self.API_URL}/{uid}?site=stackoverflow"
            else:
                url = f"{self.API_URL}?inname={clean}&site=stackoverflow&pagesize=1"

            res = await self.client.get(url)
            if res.status_code != 200:
                self.last_status = "unavailable"
                self.last_error = f"Stack Overflow HTTP {res.status_code}"
                return None

            data = res.json()
            items = data.get("items", [])
            if not items:
                self.last_status = "empty"
                return None

            user = items[0]
            display_name = user.get("display_name")
            user_id = str(user.get("user_id"))
            reputation = user.get("reputation", 0)
            badges = user.get("badge_counts", {})
            gold = badges.get("gold", 0)
            silver = badges.get("silver", 0)
            bronze = badges.get("bronze", 0)
            avatar_url = user.get("profile_image")
            website = user.get("website_url")
            location = user.get("location")
            profile_url = user.get("link") or f"https://stackoverflow.com/users/{user_id}"

            activities = [
                NormalizedActivity(
                    id=f"act_so_{user_id}",
                    category="Technical Q&A",
                    title=f"Stack Overflow Reputation: {reputation:,}",
                    description=f"Public developer contributions with {gold}🥇 {silver}🥈 {bronze}🥉 badges",
                    organization="Stack Overflow Community",
                    date=str(datetime.now().year),
                    source_url=profile_url,
                    source_platform="Stack Overflow",
                    confidence=0.92,
                    metadata={
                        "reputation": reputation,
                        "gold_badges": gold,
                        "silver_badges": silver,
                        "bronze_badges": bronze
                    }
                )
            ]

            self.last_status = "complete"
            return NormalizedSource(
                source_id=f"src_so_{user_id}",
                platform="Stack Overflow",
                source_type="technical_community",
                profile_id=user_id,
                username=display_name.replace(" ", "").lower(),
                display_name=display_name,
                avatar_url=avatar_url,
                organization=None,
                location=location,
                website=website,
                bio=f"Stack Overflow Developer | Reputation: {reputation:,} | Badges: {gold}🥇 {silver}🥈 {bronze}🥉",
                links=[profile_url],
                activities=activities,
                projects=[],
                source_url=profile_url,
                retrieved_at=self._now_iso(),
                freshness="active",
                reliability=0.92,
                status="success"
            )

        except Exception as e:
            self.last_status = "failed"
            self.last_error = str(e)
            logger.error(f"Stack Overflow fetch error for {identifier}: {e}")
            return None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []

    async def search(self, query: str) -> List[NormalizedSource]:
        prof = await self.get_profile(query)
        return [prof] if prof else []
