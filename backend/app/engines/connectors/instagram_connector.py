import re
import httpx
import logging
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.instagram")

class InstagramConnector(BaseConnector):
    """
    Apify-powered Instagram Intelligence Connector.
    Uses Apify actor 'apify/instagram-scraper' (ID: shu8hvrXbJbY3Eb9W)
    to extract verified public profiles, bios, follower statistics, and recent posts.
    """

    ACTOR_ID = "apify~instagram-scraper"

    def __init__(self):
        super().__init__(platform_name="Instagram", reliability=0.88)
        self.api_token = settings.APIFY_API_TOKEN
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
        self.last_status = "connected" if self.api_token else "unconfigured"
        self.last_error: Optional[str] = None

    async def close(self):
        await self.client.aclose()

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _extract_username(self, text: str) -> Optional[str]:
        """Extract clean Instagram username from URL, @mention, or string."""
        clean = text.strip()
        # Check if URL
        match = re.search(r'(?:https?://)?(?:www\.)?instagram\.com/([a-zA-Z0-9_\.]+)', clean)
        if match:
            handle = match.group(1).rstrip('/')
            if handle not in ("p", "reel", "stories", "explore", "tv"):
                return handle
        # Check if @mention
        if clean.startswith("@"):
            return clean.lstrip("@").strip()
        # Check single alphanumeric word with dots/underscores
        if re.match(r'^[a-zA-Z0-9_\.]{3,30}$', clean) and " " not in clean:
            return clean
        return None

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Fetch full Instagram profile data via Apify actor."""
        username = self._extract_username(identifier)
        if not username:
            return None

        if not self.api_token:
            logger.warning("Apify API token not configured. Cannot run Instagram scraper.")
            self.last_status = "unavailable"
            self.last_error = "APIFY_API_TOKEN is missing"
            return None

        url = f"https://api.apify.com/v2/acts/{self.ACTOR_ID}/run-sync-get-dataset-items?token={self.api_token}&timeout=25"
        payload = {
            "usernames": [username],
            "resultsLimit": 5,
            "skipPinnedPosts": False
        }

        try:
            logger.info(f"Running Apify Instagram scraper for @{username}...")
            res = await self.client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            if res.status_code not in (200, 201):
                logger.warning(f"Apify Instagram scraper returned status {res.status_code}: {res.text[:200]}")
                self.last_status = "failed"
                self.last_error = f"Apify HTTP {res.status_code}"
                return None

            items = res.json()
            if not items or not isinstance(items, list):
                logger.info(f"No Instagram profile items returned for @{username}")
                self.last_status = "empty"
                return None

            item: Dict[str, Any] = items[0]
            ig_user = item.get("username") or username
            display_name = item.get("fullName") or item.get("name") or ig_user
            bio = item.get("biography") or ""
            avatar_url = item.get("profilePicUrlHD") or item.get("profilePicUrl")
            website = item.get("externalUrl")
            followers = item.get("followersCount", 0)
            following = item.get("followsCount", 0)
            posts_count = item.get("postsCount", 0)
            is_verified = item.get("verified", False)
            is_business = item.get("isBusinessAccount", False)
            business_category = item.get("businessCategoryName", "")

            profile_url = f"https://www.instagram.com/{ig_user}/"

            # Parse recent post activities
            activities: List[NormalizedActivity] = []
            posts = item.get("latestPosts", []) or item.get("posts", [])
            for post in posts[:6]:
                caption = post.get("caption") or ""
                short_caption = (caption[:120] + "...") if len(caption) > 120 else caption
                post_url = post.get("url") or f"https://www.instagram.com/p/{post.get('shortCode')}/" if post.get('shortCode') else profile_url
                post_date = post.get("timestamp") or self._now_iso()
                likes = post.get("likesCount", 0)
                comments = post.get("commentsCount", 0)

                activities.append(
                    NormalizedActivity(
                        id=f"ig_post_{post.get('id', hash(post_url))}",
                        category="Social Media",
                        title=f"Instagram Post ({likes} likes, {comments} comments)",
                        description=short_caption or "Public Instagram post",
                        organization="Instagram",
                        date=post_date[:10] if post_date else self._now_iso()[:10],
                        source_url=post_url,
                        source_platform="Instagram",
                        confidence=0.85,
                        metadata={
                            "likes": likes,
                            "comments": comments,
                            "type": post.get("type", "image")
                        }
                    )
                )

            # Build enriched bio description
            desc_parts = []
            if bio:
                desc_parts.append(bio)
            stats = f"Followers: {followers:,} | Following: {following:,} | Posts: {posts_count:,}"
            if is_verified:
                stats += " | Verified Account"
            if business_category:
                stats += f" | Category: {business_category}"
            desc_parts.append(f"[{stats}]")

            source = NormalizedSource(
                source_id=f"src_ig_{ig_user}",
                platform="Instagram",
                source_type="profile",
                profile_id=ig_user,
                username=ig_user,
                display_name=display_name,
                organization=business_category or None,
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
            logger.error(f"Error during Apify Instagram scrape: {str(e)}", exc_info=True)
            self.last_status = "failed"
            self.last_error = str(e)
            return None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        """Fetch activities (recent posts) for an Instagram profile."""
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []

    async def search(self, query: str) -> List[NormalizedSource]:
        """Search or resolve Instagram profile from query."""
        clean_q = query.strip()
        if not clean_q:
            return []

        # If query contains or is an Instagram handle/URL
        username = self._extract_username(clean_q)
        if username:
            prof = await self.get_profile(username)
            return [prof] if prof else []

        return []
