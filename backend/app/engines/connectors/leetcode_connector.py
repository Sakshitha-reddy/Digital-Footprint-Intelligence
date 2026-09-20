import re
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.leetcode")

class LeetCodeConnector(BaseConnector):
    """
    LeetCode Developer Identity Connector.
    Uses official LeetCode GraphQL API to discover public problem solving statistics,
    ranking, reputation, contest rating, and badges.
    """

    GRAPHQL_URL = "https://leetcode.com/graphql"

    def __init__(self):
        super().__init__(platform_name="LeetCode", reliability=0.92)
        self.client = httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
                "Referer": "https://leetcode.com",
                "Content-Type": "application/json"
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
        match = re.search(r'(?:https?://)?(?:www\.)?leetcode\.com/(?:u/)?([a-zA-Z0-9_\-]+)', clean)
        if match:
            return match.group(1).rstrip('/')
        if clean.startswith("@"):
            return clean.lstrip("@").strip()
        if re.match(r'^[a-zA-Z0-9_\-]{3,30}$', clean) and " " not in clean:
            return clean
        return None

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Fetch LeetCode profile, statistics, and contest ranking via GraphQL."""
        username = self._extract_username(identifier)
        if not username:
            return None

        query = """
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              aboutMe
              userAvatar
              ranking
              reputation
              countryName
              company
              school
              skillTags
            }
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
            badges {
              displayName
              icon
            }
          }
          userContestRanking(username: $username) {
            attendedContestsCount
            rating
            globalRanking
            topPercentage
            badge {
              name
            }
          }
        }
        """

        try:
            res = await self.client.post(
                self.GRAPHQL_URL,
                json={"query": query, "variables": {"username": username}}
            )

            if res.status_code != 200:
                self.last_status = "unavailable"
                self.last_error = f"LeetCode HTTP {res.status_code}"
                return None

            data = res.json().get("data", {})
            matched = data.get("matchedUser")
            if not matched:
                self.last_status = "empty"
                return None

            user_profile = matched.get("profile") or {}
            submit_stats = matched.get("submitStats", {}).get("acSubmissionNum", [])
            contest_stats = data.get("userContestRanking") or {}
            badges = matched.get("badges") or []

            # Solved problems breakdown
            easy_solved = 0
            med_solved = 0
            hard_solved = 0
            total_solved = 0
            for item in submit_stats:
                diff = item.get("difficulty")
                cnt = item.get("count", 0)
                if diff == "All":
                    total_solved = cnt
                elif diff == "Easy":
                    easy_solved = cnt
                elif diff == "Medium":
                    med_solved = cnt
                elif diff == "Hard":
                    hard_solved = cnt

            ranking = user_profile.get("ranking")
            reputation = user_profile.get("reputation", 0)
            contest_rating = contest_stats.get("rating")
            contests_attended = contest_stats.get("attendedContestsCount", 0)

            stats_parts = [f"Solved: {total_solved} (Easy: {easy_solved}, Medium: {med_solved}, Hard: {hard_solved})"]
            if ranking:
                stats_parts.append(f"Global Ranking: #{ranking:,}")
            if contest_rating:
                stats_parts.append(f"Contest Rating: {round(contest_rating, 1)} ({contests_attended} contests)")
            if badges:
                badge_names = [b.get("displayName") for b in badges if b.get("displayName")]
                if badge_names:
                    stats_parts.append(f"Badges: {', '.join(badge_names[:4])}")

            bio_summary = f"LeetCode Competitive Programmer | {' | '.join(stats_parts)}"
            if user_profile.get("aboutMe"):
                bio_summary = f"{user_profile.get('aboutMe')}\n[{bio_summary}]"

            profile_url = f"https://leetcode.com/u/{username}/"

            # Create activity item for competitive programming stats
            activities: List[NormalizedActivity] = []
            if total_solved > 0 or contest_rating:
                activities.append(
                    NormalizedActivity(
                        id=f"lc_stats_{username}",
                        category="Competitive Programming",
                        title=f"LeetCode Problem Solving ({total_solved} Solved)",
                        description=f"Solved {total_solved} algorithmic challenges. Easy: {easy_solved}, Medium: {med_solved}, Hard: {hard_solved}." + (f" Contest Rating: {round(contest_rating, 1)}" if contest_rating else ""),
                        organization="LeetCode",
                        date=self._now_iso()[:10],
                        source_url=profile_url,
                        source_platform="LeetCode",
                        confidence=0.94,
                        metadata={
                            "total_solved": total_solved,
                            "easy": easy_solved,
                            "medium": med_solved,
                            "hard": hard_solved,
                            "contest_rating": contest_rating,
                            "ranking": ranking
                        }
                    )
                )

            source = NormalizedSource(
                source_id=f"src_lc_{username}",
                platform="LeetCode",
                source_type="profile",
                profile_id=username,
                username=username,
                display_name=user_profile.get("realName") or username,
                organization=user_profile.get("company") or user_profile.get("school") or None,
                location=user_profile.get("countryName"),
                bio=bio_summary,
                avatar_url=user_profile.get("userAvatar"),
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
            logger.error(f"Error fetching LeetCode profile for {username}: {e}")
            self.last_status = "failed"
            self.last_error = str(e)
            return None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []

    async def search(self, query: str) -> List[NormalizedSource]:
        username = self._extract_username(query)
        if username:
            prof = await self.get_profile(username)
            return [prof] if prof else []
        return []
