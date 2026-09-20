import re
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.codechef")

class CodeChefConnector(BaseConnector):
    """
    CodeChef Competitive Programming Connector.
    Extracts public competitive rating, star rating, global/country rank,
    and contest statistics.
    """

    BASE_URL = "https://www.codechef.com/users"

    def __init__(self):
        super().__init__(platform_name="CodeChef", reliability=0.88)
        self.client = httpx.AsyncClient(
            timeout=10.0,
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

    def _extract_handle(self, text: str) -> Optional[str]:
        clean = text.strip()
        match = re.search(r'(?:https?://)?(?:www\.)?codechef\.com/users/([a-zA-Z0-9_\-]+)', clean)
        if match:
            return match.group(1).rstrip('/')
        if clean.startswith("@"):
            return clean.lstrip("@").strip()
        if re.match(r'^[a-zA-Z0-9_\-]{2,30}$', clean) and " " not in clean:
            return clean
        return None

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Fetch CodeChef public profile and contest rating."""
        handle = self._extract_handle(identifier)
        if not handle:
            return None

        url = f"{self.BASE_URL}/{handle}"
        try:
            res = await self.client.get(url)
            if res.status_code == 404:
                self.last_status = "empty"
                return None
            if res.status_code != 200:
                self.last_status = "unavailable"
                self.last_error = f"CodeChef HTTP {res.status_code}"
                return None

            html = res.text
            # If redirected to home or page says user not found
            if "Could not find user" in html or "user does not exist" in html.lower():
                self.last_status = "empty"
                return None

            # Extract Name
            name_match = re.search(r'<h1 class="h2-style"[^>]*>([^<]+)</h1>', html)
            display_name = name_match.group(1).strip() if name_match else handle

            # Extract Rating
            rating_match = re.search(r'class="rating-number">([^<]+)<', html)
            rating = rating_match.group(1).strip() if rating_match else None

            # Extract Stars
            stars_match = re.search(r'class="rating-star">([^<]+)<', html)
            stars = stars_match.group(1).strip() if stars_match else None

            # Extract Global & Country Rank
            global_rank_match = re.search(r'href="/ratings/all"[^>]*><strong>([0-9,]+)</strong>', html)
            global_rank = global_rank_match.group(1).strip() if global_rank_match else None

            # Extract Country
            country_match = re.search(r'class="user-country-name"[^>]*>([^<]+)<', html)
            country = country_match.group(1).strip() if country_match else None

            # Extract Institution / Organization
            inst_match = re.search(r'Institution:</span>\s*<span>([^<]+)<', html)
            institution = inst_match.group(1).strip() if inst_match else None

            # Extract Avatar
            avatar_match = re.search(r'class="profile-header-user-details"[^>]*>.*?<img[^>]+src="([^"]+)"', html, re.DOTALL)
            avatar_url = avatar_match.group(1).strip() if avatar_match else None

            desc_parts = []
            if rating and rating != "N/A":
                desc_parts.append(f"Rating: {rating}")
            if stars:
                desc_parts.append(f"Stars: {stars}")
            if global_rank:
                desc_parts.append(f"Global Rank: #{global_rank}")
            if institution:
                desc_parts.append(f"Institution: {institution}")

            bio_summary = " | ".join(desc_parts) or f"CodeChef competitive programming profile for {handle}"

            activities: List[NormalizedActivity] = []
            if rating and rating != "N/A":
                activities.append(
                    NormalizedActivity(
                        id=f"cc_rating_{handle}",
                        category="Competitive Programming",
                        title=f"CodeChef Competitive Profile (Rating: {rating})",
                        description=f"Active CodeChef competitor. Rating: {rating}" + (f", {stars}" if stars else "") + (f", Global Rank: #{global_rank}" if global_rank else ""),
                        organization="CodeChef",
                        date=self._now_iso()[:10],
                        source_url=url,
                        source_platform="CodeChef",
                        confidence=0.88,
                        metadata={
                            "rating": rating,
                            "stars": stars,
                            "global_rank": global_rank
                        }
                    )
                )

            source = NormalizedSource(
                source_id=f"src_cc_{handle}",
                platform="CodeChef",
                source_type="profile",
                profile_id=handle,
                username=handle,
                display_name=display_name,
                organization=institution,
                location=country,
                bio=bio_summary,
                avatar_url=avatar_url,
                links=[url],
                activities=activities,
                projects=[],
                source_url=url,
                retrieved_at=self._now_iso(),
                freshness="active",
                reliability=self.reliability,
                status="success"
            )

            self.last_status = "complete"
            return source

        except Exception as e:
            logger.error(f"Error fetching CodeChef profile for {handle}: {e}")
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
