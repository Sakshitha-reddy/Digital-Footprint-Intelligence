import re
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.twitter")

class TwitterConnector(BaseConnector):
    """
    Apify-powered Twitter / X Intelligence Connector.
    Uses Apify actor 'apidojo/tweet-scraper' (ID: 61RPP7dywgiy0JPD0)
    to extract verified public tweets, user bios, follower counts, and recent activity.
    """

    ACTOR_ID = "apidojo~tweet-scraper"

    def __init__(self):
        super().__init__(platform_name="Twitter / X", reliability=0.90)
        self.api_token = settings.APIFY_API_TOKEN
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
        self.last_status = "connected" if self.api_token else "unconfigured"
        self.last_error: Optional[str] = None

    async def close(self):
        await self.client.aclose()

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _extract_username(self, text: str) -> Optional[str]:
        """Extract clean Twitter/X handle from URL, @mention, or query."""
        clean = text.strip()
        # Match twitter.com or x.com URLs
        match = re.search(r'(?:https?://)?(?:www\.)?(?:twitter|x)\.com/([a-zA-Z0-9_]+)', clean)
        if match:
            handle = match.group(1).rstrip('/')
            if handle.lower() not in ("home", "explore", "notifications", "messages", "search", "i"):
                return handle
        # Match @handle
        if clean.startswith("@"):
            return clean.lstrip("@").strip()
        # Single alphanumeric word
        if re.match(r'^[a-zA-Z0-9_]{1,25}$', clean) and " " not in clean:
            return clean
        return None

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Fetch Twitter/X profile and recent tweets via Apify tweet-scraper."""
        username = self._extract_username(identifier)
        if not username:
            return None

        if not self.api_token:
            logger.warning("Apify API token not configured. Cannot run Twitter scraper.")
            self.last_status = "unavailable"
            self.last_error = "APIFY_API_TOKEN is missing"
            return None

        url = f"https://api.apify.com/v2/acts/{self.ACTOR_ID}/run-sync-get-dataset-items?token={self.api_token}&timeout=25"
        payload = {
            "twitterHandles": [username],
            "maxItems": 5,
            "sort": "Latest"
        }

        try:
            logger.info(f"Running Apify Twitter scraper for @{username}...")
            res = await self.client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            if res.status_code not in (200, 201):
                logger.warning(f"Apify Twitter scraper returned status {res.status_code}: {res.text[:200]}")
                self.last_status = "failed"
                self.last_error = f"Apify HTTP {res.status_code}"
                return None

            items = res.json()
            if not items or not isinstance(items, list):
                logger.info(f"No tweets returned for @{username}")
                self.last_status = "empty"
                return None

            first_item = items[0]
            # Apify apidojo/tweet-scraper stores author information inside 'author' dict or 'user' dict
            author_info = first_item.get("author") or first_item.get("user") or {}

            display_name = author_info.get("name") or first_item.get("name") or username
            tw_user = author_info.get("userName") or author_info.get("username") or username
            bio = author_info.get("description") or ""
            avatar_url = author_info.get("profilePicture") or author_info.get("profile_image_url_https")
            followers = author_info.get("followers") or author_info.get("followers_count", 0)
            following = author_info.get("following") or author_info.get("friends_count", 0)
            is_verified = author_info.get("isBlueVerified") or author_info.get("verified", False)
            location = author_info.get("location")
            website = author_info.get("url")

            profile_url = f"https://x.com/{tw_user}"

            # Parse recent tweets into normalized activities
            activities: List[NormalizedActivity] = []
            for item in items[:6]:
                tweet_text = item.get("text") or item.get("full_text") or ""
                short_text = (tweet_text[:120] + "...") if len(tweet_text) > 120 else tweet_text
                tweet_url = item.get("url") or f"https://x.com/{tw_user}/status/{item.get('id')}" if item.get('id') else profile_url
                tweet_date = item.get("createdAt") or item.get("created_at") or self._now_iso()
                likes = item.get("likeCount") or item.get("favorite_count", 0)
                retweets = item.get("retweetCount") or item.get("retweet_count", 0)

                activities.append(
                    NormalizedActivity(
                        id=f"tw_tweet_{item.get('id', hash(tweet_url))}",
                        category="Social Media",
                        title=f"Tweet ({likes} likes, {retweets} retweets)",
                        description=short_text or "Public Twitter / X post",
                        organization="Twitter / X",
                        date=str(tweet_date)[:10] if tweet_date else self._now_iso()[:10],
                        source_url=tweet_url,
                        source_platform="Twitter / X",
                        confidence=0.90,
                        metadata={
                            "likes": likes,
                            "retweets": retweets,
                            "full_text": tweet_text
                        }
                    )
                )

            # Build enriched bio description
            desc_parts = []
            if bio:
                desc_parts.append(bio)
            stats = f"Followers: {followers:,} | Following: {following:,}"
            if is_verified:
                stats += " | Verified (Blue)"
            desc_parts.append(f"[{stats}]")

            source = NormalizedSource(
                source_id=f"src_tw_{tw_user}",
                platform="Twitter / X",
                source_type="profile",
                profile_id=tw_user,
                username=tw_user,
                display_name=display_name,
                organization=None,
                location=location,
                website=website,
                bio="\n".join(desc_parts),
                avatar_url=avatar_url,
                links=[profile_url] + ([website] if website else []),
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
            logger.error(f"Error during Apify Twitter scrape: {str(e)}", exc_info=True)
            self.last_status = "failed"
            self.last_error = str(e)
            return None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        """Fetch activities (recent tweets) for a Twitter/X handle."""
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []

    async def search(self, query: str) -> List[NormalizedSource]:
        """Search or resolve Twitter / X profile from query."""
        clean_q = query.strip()
        if not clean_q:
            return []

        username = self._extract_username(clean_q)
        if username:
            prof = await self.get_profile(username)
            return [prof] if prof else []

        return []
