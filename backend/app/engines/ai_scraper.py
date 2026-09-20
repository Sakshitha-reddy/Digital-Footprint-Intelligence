import httpx
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("neurax.ai_scraper")

class AIWebScraperService:
    """
    Apify Actor: apify/ai-web-scraper (Actor ID: paOtbjvyUiNsr1Qms).
    AI-first web scraping Actor that uses LLMs + browser automation
    to extract structured records, cross-platform social links,
    and rendered content from public target websites using plain-language instructions.
    """

    ACTOR_ID = "paOtbjvyUiNsr1Qms"

    def __init__(self):
        self.api_token = settings.APIFY_API_TOKEN
        self.client = httpx.AsyncClient(timeout=45.0, follow_redirects=True)

    async def close(self):
        await self.client.aclose()

    async def scrape_target_site(
        self,
        target_url: str,
        instructions: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Extracts structured identity, social links, and bio from any target site using natural language instructions.
        """
        if not self.api_token or not target_url:
            return None

        clean_url = target_url.strip()
        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            clean_url = f"https://{clean_url}"

        default_instructions = (
            "Extract the individual's full name, bio, job title, email address, "
            "organizations, and all social media profiles (GitHub, LinkedIn, Twitter/X, Instagram, YouTube)."
        )

        url = f"https://api.apify.com/v2/acts/{self.ACTOR_ID}/run-sync-get-dataset-items?token={self.api_token}&timeout=30"
        payload = {
            "startUrls": [{"url": clean_url}],
            "instructions": instructions or default_instructions,
            "maxPagesPerCrawl": 1
        }

        try:
            logger.info(f"Running Apify AI Web Scraper for: {clean_url}...")
            res = await self.client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            if res.status_code in (200, 201):
                items = res.json()
                if items and isinstance(items, list):
                    return items[0]
            else:
                logger.warning(f"AI Web Scraper returned HTTP {res.status_code}")
        except Exception as e:
            logger.warning(f"Failed to scrape {clean_url} with AI Web Scraper: {e}")

        return None

# Global singleton
ai_scraper = AIWebScraperService()
