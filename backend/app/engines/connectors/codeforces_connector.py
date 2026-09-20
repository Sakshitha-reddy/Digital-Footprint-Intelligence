import re
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.codeforces")

class CodeforcesConnector(BaseConnector):
    """
    Codeforces Competitive Programming Connector.
    Uses official Codeforces REST API to discover competitive rating, rank,
    max rank, contest performance, and organizational affiliation.
    """

    API_URL = "https://codeforces.com/api/user.info"

    def __init__(self):
        super().__init__(platform_name="Codeforces", reliability=0.95)
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

    def _extract_handle(self, text: str) -> Optional[str]:
        clean = text.strip()
        match = re.search(r'(?:https?://)?(?:www\.)?codeforces\.com/profile/([a-zA-Z0-9_\.\-]+)', clean)
        if match:
            return match.group(1).rstrip('/')
        if clean.startswith("@"):
            return clean.lstrip("@").strip()
        if re.match(r'^[a-zA-Z0-9_\.\-]{2,30}$', clean) and " " not in clean:
            return clean
        return None

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Fetch Codeforces user details via official REST API."""
        handle = self._extract_handle(identifier)
        if not handle:
            return None

        try:
            res = await self.client.get(f"{self.API_URL}?handles={handle}")
            if res.status_code != 200:
                self.last_status = "unavailable"
                self.last_error = f"Codeforces HTTP {res.status_code}"
                return None

            data = res.json()
            if data.get("status") != "OK" or not data.get("result"):
                self.last_status = "empty"
                return None

            user_info = data["result"][0]
            cf_handle = user_info.get("handle") or handle
            rating = user_info.get("rating")
            max_rating = user_info.get("maxRating")
            rank = user_info.get("rank")
            max_rank = user_info.get("maxRank")
            organization = user_info.get("organization")
            country = user_info.get("country")
            city = user_info.get("city")
            avatar = user_info.get("avatar") or user_info.get("titlePhoto")
            contribution = user_info.get("contribution", 0)

            profile_url = f"https://codeforces.com/profile/{cf_handle}"

            desc_parts = []
            if rank:
                desc_parts.append(f"Rank: {rank.capitalize()} (Rating: {rating})")
            if max_rank and max_rank != rank:
                desc_parts.append(f"Max Rank: {max_rank.capitalize()} (Peak Rating: {max_rating})")
            if contribution:
                desc_parts.append(f"Contribution: {contribution:+d}")
            if organization:
                desc_parts.append(f"Organization: {organization}")

            location_str = ", ".join([c for c in [city, country] if c]) or None

            activities: List[NormalizedActivity] = []
            if rating:
                activities.append(
                    NormalizedActivity(
                        id=f"cf_rating_{cf_handle}",
                        category="Competitive Programming",
                        title=f"Codeforces {rank.capitalize() if rank else 'Rank'} (Rating: {rating})",
                        description=f"Active competitive contestant on Codeforces. Current rating {rating}, peak {max_rating}. Rank category: {rank}." + (f" Affiliated with {organization}." if organization else ""),
                        organization=organization or "Codeforces",
                        date=self._now_iso()[:10],
                        source_url=profile_url,
                        source_platform="Codeforces",
                        confidence=0.96,
                        metadata={
                            "rating": rating,
                            "max_rating": max_rating,
                            "rank": rank,
                            "max_rank": max_rank,
                            "contribution": contribution
                        }
                    )
                )

            source = NormalizedSource(
                source_id=f"src_cf_{cf_handle}",
                platform="Codeforces",
                source_type="profile",
                profile_id=cf_handle,
                username=cf_handle,
                display_name=f"{cf_handle}" + (f" ({rank.capitalize()})" if rank else ""),
                organization=organization,
                location=location_str,
                bio=" | ".join(desc_parts) or f"Codeforces competitive programming account for {cf_handle}",
                avatar_url=avatar if avatar and "no-avatar" not in avatar else None,
                links=[profile_url],
                activities=activities,
                projects=[],
                source_url=profile_url,
                retrieved_at=self._now_iso(),
                freshness="active",
                reliability=self.reliability,
                status="success"
            )

            self.last_status = "complete"
            return source

        except Exception as e:
            logger.error(f"Error fetching Codeforces profile for {handle}: {e}")
            self.last_status = "failed"
            self.last_error = str(e)
            return None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []

    async def search(self, query: str) -> List[NormalizedSource]:
        handle = self._extract_handle(query)
        if handle:
            prof = await self.get_profile(handle)
            return [prof] if prof else []
        return []
