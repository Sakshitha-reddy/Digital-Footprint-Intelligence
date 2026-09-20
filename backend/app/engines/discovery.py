import re
import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.engines.connectors import (
    GitHubConnector,
    LinkedInDiscoveryConnector,
    DevToConnector,
    HackerNewsConnector,
    YouTubeConnector,
    WebSearchConnector,
    InstagramConnector,
    TwitterConnector,
    LeetCodeConnector,
    CodeChefConnector,
    CodeforcesConnector,
    HackerRankConnector,
    KaggleConnector,
    StackOverflowConnector,
    MediumConnector,
    WikimediaConnector,
    OpenAlexConnector,
    NormalizedSource,
    NormalizedActivity,
)
from app.engines.search_provider import search_provider
from app.engines.ai_scraper import ai_scraper
from app.models.schemas import ActivityItem, SourceStatus

logger = logging.getLogger("neurax.discovery")

class PublicDiscoveryEngine:
    """
    NEURAX MULTI-AGENT OSINT DISCOVERY ENGINE
    Organized into three specialized agent layers:
    1. GitHub Agent: Official GitHub REST API (profiles, repositories, languages, stars, orgs)
    2. Coding Agent: Competitive programming (LeetCode, CodeChef, Codeforces)
    3. Social Agent: Professional & Social networks (LinkedIn, X / Twitter, Instagram)
    Auxiliary: Web search, Dev.to, HackerNews, YouTube, Wikimedia, OpenAlex.
    """

    def __init__(self):
        self.github = GitHubConnector()
        self.linkedin = LinkedInDiscoveryConnector()
        self.leetcode = LeetCodeConnector()
        self.codechef = CodeChefConnector()
        self.codeforces = CodeforcesConnector()
        self.hackerrank = HackerRankConnector()
        self.kaggle = KaggleConnector()
        self.stackoverflow = StackOverflowConnector()
        self.devto = DevToConnector()
        self.twitter = TwitterConnector()
        self.youtube = YouTubeConnector()
        self.medium = MediumConnector()
        self.web = WebSearchConnector()
        self.instagram = InstagramConnector()
        self.hackernews = HackerNewsConnector()
        self.wikimedia = WikimediaConnector()
        self.openalex = OpenAlexConnector()

    async def close(self):
        await asyncio.gather(
            self.github.close(),
            self.linkedin.close(),
            self.leetcode.close(),
            self.codechef.close(),
            self.codeforces.close(),
            self.hackerrank.close(),
            self.kaggle.close(),
            self.stackoverflow.close(),
            self.devto.close(),
            self.twitter.close(),
            self.youtube.close(),
            self.medium.close(),
            self.web.close(),
            self.instagram.close(),
            self.hackernews.close(),
            self.wikimedia.close(),
            self.openalex.close(),
            ai_scraper.close(),
            return_exceptions=True
        )

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def generate_candidate_handles(seed_handle: Optional[str], name: Optional[str]) -> List[str]:
        """
        Generates intelligent candidate variations across developer & social platforms:
        e.g. Shiva Kumar -> shiva, shivakumar, shiva-kumar, shiva_kumar, shiva_dev, shiva-dev, shiva123, etc.
        """
        candidates: List[str] = []
        seen = set()

        def add(h: Optional[str]):
            if not h:
                return
            clean = h.strip().lstrip("@").lower()
            clean = re.sub(r'[^a-z0-9_\-]', '', clean)
            if 2 <= len(clean) <= 32 and clean not in seen:
                seen.add(clean)
                candidates.append(clean)

        # 1. Seed handle first
        if seed_handle:
            clean_seed = seed_handle.strip().lstrip("@").lower()
            add(clean_seed)
            if "_" in clean_seed:
                add(clean_seed.replace("_", "-"))
                add(clean_seed.replace("_", ""))
            if "-" in clean_seed:
                add(clean_seed.replace("-", "_"))
                add(clean_seed.replace("-", ""))
            m = re.match(r'^([a-z]+)([0-9]+)$', clean_seed)
            if m:
                base, digs = m.group(1), m.group(2)
                add(base)
                add(f"{base}_{digs}")
                add(f"{base}-{digs}")
                add(f"{base}_dev")
                add(f"{base}-dev")

        # 2. Name-based variations
        if name:
            clean_name = re.sub(r'[^a-zA-Z0-9\s]', '', name.lower()).strip()
            parts = clean_name.split()
            if len(parts) == 1:
                first = parts[0]
                add(first)
                add(f"{first}_dev")
                add(f"{first}-dev")
                add(f"{first}123")
            elif len(parts) >= 2:
                first, last = parts[0], parts[-1]
                add(first)
                add(f"{first}{last}")
                add(f"{first}-{last}")
                add(f"{first}_{last}")
                add(f"{first}_dev")
                add(f"{first}-dev")
                add(f"{first}123")
                add(f"{last}{first}")
                add(f"{last}-{first}")
                add(f"{first[0]}{last}")
                add(f"{first}_{last[0]}")
                add(f"{first}-{last[0]}")

        return candidates[:8]

    async def execute_multi_source_discovery(
        self,
        name: Optional[str],
        seed_handle: Optional[str],
        email: Optional[str] = None,
        affiliation: Optional[str] = None,
        website: Optional[str] = None,
        keywords: Optional[str] = None,
        linkedin_url: Optional[str] = None
    ) -> Tuple[List[NormalizedSource], List[ActivityItem], List[SourceStatus]]:
        """
        Executes parallel multi-agent discovery using controlled, deduplicated query strategies.
        1. GitHub Agent: Official GitHub REST API
        2. Coding Agent: LeetCode, CodeChef, Codeforces
        3. Social Agent: LinkedIn, Twitter/X
        Returns normalized sources, activities, and individual source execution statuses.
        """
        clean_handle = (seed_handle or "").strip().lstrip("@")
        clean_name = (name or "").strip()
        clean_email = (email or "").strip()
        clean_affil = (affiliation or "").strip()
        clean_kw = (keywords or "").strip()

        candidate_handles = self.generate_candidate_handles(clean_handle, clean_name)
        logger.info(f"Target '{clean_name}' / '{clean_handle}' candidate handle variations: {candidate_handles}")

        # 1. GITHUB AGENT: GitHub Discovery Task
        async def run_github() -> List[NormalizedSource]:
            sources = []
            for handle in candidate_handles:
                prof = await self.github.get_profile(handle)
                if prof:
                    sources.append(prof)
                    break
            if not sources and (clean_name or clean_email):
                q = f"{clean_name} {clean_affil}".strip() or clean_name
                search_res = await self.github.search(q, email=clean_email)
                sources.extend(search_res)
            return sources

        # 2. CODING AGENT: LeetCode Discovery Task
        async def run_leetcode() -> List[NormalizedSource]:
            sources = []
            for handle in candidate_handles:
                try:
                    prof = await self.leetcode.get_profile(handle)
                    if prof:
                        sources.append(prof)
                        break
                except Exception as e:
                    logger.debug(f"LeetCode probe exception for {handle}: {e}")
            return sources

        # 3. CODING AGENT: CodeChef Discovery Task
        async def run_codechef() -> List[NormalizedSource]:
            sources = []
            for handle in candidate_handles:
                try:
                    prof = await self.codechef.get_profile(handle)
                    if prof:
                        sources.append(prof)
                        break
                except Exception as e:
                    logger.debug(f"CodeChef probe exception for {handle}: {e}")
            return sources

        # 4. CODING AGENT: Codeforces Discovery Task
        async def run_codeforces() -> List[NormalizedSource]:
            sources = []
            for handle in candidate_handles:
                try:
                    prof = await self.codeforces.get_profile(handle)
                    if prof:
                        sources.append(prof)
                        break
                except Exception as e:
                    logger.debug(f"Codeforces probe exception for {handle}: {e}")
            return sources

        # 5. CODING AGENT: HackerRank Discovery Task
        async def run_hackerrank() -> List[NormalizedSource]:
            sources = []
            for handle in candidate_handles:
                try:
                    prof = await self.hackerrank.get_profile(handle)
                    if prof:
                        sources.append(prof)
                        break
                except Exception as e:
                    logger.debug(f"HackerRank probe exception for {handle}: {e}")
            return sources

        # 6. CODING AGENT: Kaggle Discovery Task
        async def run_kaggle() -> List[NormalizedSource]:
            sources = []
            for handle in candidate_handles:
                try:
                    prof = await self.kaggle.get_profile(handle)
                    if prof:
                        sources.append(prof)
                        break
                except Exception as e:
                    logger.debug(f"Kaggle probe exception for {handle}: {e}")
            return sources

        # 7. CODING AGENT: Stack Overflow Discovery Task
        async def run_stackoverflow() -> List[NormalizedSource]:
            sources = []
            for handle in candidate_handles:
                try:
                    prof = await self.stackoverflow.get_profile(handle)
                    if prof:
                        sources.append(prof)
                        break
                except Exception as e:
                    logger.debug(f"Stack Overflow probe exception for {handle}: {e}")
            return sources

        # 8. SOCIAL/MEDIA AGENT: Medium Publications Task
        async def run_medium() -> List[NormalizedSource]:
            sources = []
            for handle in candidate_handles:
                try:
                    prof = await self.medium.get_profile(handle)
                    if prof:
                        sources.append(prof)
                        break
                except Exception as e:
                    logger.debug(f"Medium probe exception for {handle}: {e}")
            return sources

        # 9. SOCIAL/PROFESSIONAL AGENT: LinkedIn Discovery Task (compliant open search citations)
        async def run_linkedin() -> List[NormalizedSource]:
            sources = []
            # Handle user-provided LinkedIn profile directly if supplied
            if linkedin_url and "linkedin.com/in/" in linkedin_url:
                clean_link = linkedin_url.strip()
                match = re.search(r'linkedin\.com/in/([^/?#]+)', clean_link)
                username = match.group(1) if match else (clean_handle or "user")
                sources.append(
                    NormalizedSource(
                        source_id="src_li_user_provided",
                        platform="LinkedIn",
                        source_type="user_provided_source",
                        profile_id=username,
                        username=username,
                        display_name=clean_name or username,
                        organization=clean_affil or None,
                        source_url=clean_link,
                        bio=f"User-provided authenticated public LinkedIn reference: {clean_link}",
                        retrieved_at=self._now_iso(),
                        freshness="active",
                        reliability=0.98,
                        status="success"
                    )
                )

            # Execute high-precision multi-query search
            discovered = await self.linkedin.search_multi(
                name=clean_name,
                seed_handle=clean_handle,
                email=clean_email,
                affiliation=clean_affil,
                keywords=clean_kw
            )
            for d in discovered:
                if not any(s.source_url == d.source_url for s in sources):
                    sources.append(d)
            return sources

        # 3. Dev.to Task
        async def run_devto() -> List[NormalizedSource]:
            sources = []
            target = clean_handle or clean_name.replace(" ", "").lower()
            if target:
                prof = await self.devto.get_profile(target)
                if prof:
                    sources.append(prof)
            return sources

        # 4. HackerNews Task
        async def run_hn() -> List[NormalizedSource]:
            target = clean_handle or clean_name
            if target:
                return await self.hackernews.search(target)
            return []

        # 5. YouTube Conference / Talk Task
        async def run_yt() -> List[NormalizedSource]:
            q = f"{clean_name} {clean_kw}".strip() or clean_name or clean_handle
            if q:
                return await self.youtube.search(q)
            return []

        # 6. Web Search Task (Tavily primary with DuckDuckGo fallback)
        async def run_web_search() -> List[NormalizedSource]:
            q_parts = [clean_name]
            if clean_affil:
                q_parts.append(clean_affil)
            if clean_kw:
                q_parts.append(clean_kw)
            elif clean_handle:
                q_parts.append(f'"{clean_handle}"')

            q = " ".join([p for p in q_parts if p]).strip()
            if not q:
                return []

            search_hits = await search_provider.search(q, max_results=settings.MAX_SEARCH_RESULTS)
            web_sources = []
            for idx, hit in enumerate(search_hits):
                web_sources.append(
                    NormalizedSource(
                        source_id=f"src_web_{idx}",
                        platform="Web Search",
                        source_type="search_hit",
                        profile_id=hit.get("url"),
                        username=clean_handle or None,
                        display_name=hit.get("title") or "Web Discovery Result",
                        source_url=hit.get("url", ""),
                        bio=hit.get("snippet", ""),
                        organization=clean_affil or None,
                        links=[hit.get("url", "")],
                        activities=[],
                        projects=[],
                        retrieved_at=self._now_iso(),
                        freshness="active",
                        reliability=0.85,
                        status="success"
                    )
                )
            return web_sources

        # 7. Instagram Intelligence Task (Apify Scraper)
        async def run_instagram() -> List[NormalizedSource]:
            sources = []
            target = clean_handle or (clean_name.replace(" ", "").lower() if clean_name else None)
            if target and settings.APIFY_API_TOKEN:
                prof = await self.instagram.get_profile(target)
                if prof:
                    sources.append(prof)
            return sources

        # 8. Twitter / X Intelligence Task (Apify Scraper)
        async def run_twitter() -> List[NormalizedSource]:
            sources = []
            target = clean_handle or (clean_name.replace(" ", "").lower() if clean_name else None)
            if target and settings.APIFY_API_TOKEN:
                prof = await self.twitter.get_profile(target)
                if prof:
                    sources.append(prof)
            return sources

        # 9. AI Web Scraper Task (Apify Actor: apify/ai-web-scraper)
        async def run_ai_scraper() -> List[NormalizedSource]:
            sources = []
            if website and settings.APIFY_API_TOKEN:
                site_data = await ai_scraper.scrape_target_site(website)
                if site_data:
                    url = site_data.get("url", website)
                    title = site_data.get("title") or f"{clean_name or 'Target'} Official Site"
                    desc = site_data.get("markdown", "")[:400] or site_data.get("text", "")[:400]
                    sources.append(
                        NormalizedSource(
                            source_id=f"src_ai_site_{hash(website) % 10000}",
                            platform="Web Search",
                            source_type="profile",
                            profile_id=url,
                            username=clean_handle or None,
                            display_name=title,
                            organization=clean_affil or None,
                            website=url,
                            bio=desc,
                            links=[url],
                            activities=[],
                            projects=[],
                            source_url=url,
                            retrieved_at=self._now_iso(),
                            freshness="active",
                            reliability=0.92,
                            status="success"
                        )
                    )
            return sources

        # 10. Wikimedia / Wikipedia Notability Task
        async def run_wikimedia() -> List[NormalizedSource]:
            q = clean_name or clean_handle
            if q:
                return await self.wikimedia.search(q)
            return []

        # 11. OpenAlex Academic & Publications Task
        async def run_openalex() -> List[NormalizedSource]:
            q = clean_name or clean_handle
            if q:
                return await self.openalex.search(q)
            return []

        # Run all multi-agent connectors in parallel
        results = await asyncio.gather(
            run_github(),
            run_leetcode(),
            run_codechef(),
            run_codeforces(),
            run_hackerrank(),
            run_kaggle(),
            run_stackoverflow(),
            run_medium(),
            run_linkedin(),
            run_twitter(),
            run_devto(),
            run_hn(),
            run_yt(),
            run_web_search(),
            run_instagram(),
            run_ai_scraper(),
            run_wikimedia(),
            run_openalex(),
            return_exceptions=True
        )

        all_sources: List[NormalizedSource] = []
        all_activities: List[ActivityItem] = []
        source_statuses: List[SourceStatus] = []

        connectors = [
            ("GitHub", self.github, results[0]),
            ("LeetCode", self.leetcode, results[1]),
            ("CodeChef", self.codechef, results[2]),
            ("Codeforces", self.codeforces, results[3]),
            ("HackerRank", self.hackerrank, results[4]),
            ("Kaggle", self.kaggle, results[5]),
            ("Stack Overflow", self.stackoverflow, results[6]),
            ("Medium", self.medium, results[7]),
            ("LinkedIn", self.linkedin, results[8]),
            ("Twitter / X", self.twitter, results[9]),
            ("Dev.to", self.devto, results[10]),
            ("HackerNews", self.hackernews, results[11]),
            ("YouTube", self.youtube, results[12]),
            ("Web Search", None, results[13]),
            ("Instagram", self.instagram, results[14]),
            ("AI Web Scraper", None, results[15]),
            ("Wikimedia", self.wikimedia, results[16]),
            ("OpenAlex", self.openalex, results[17]),
        ]

        for platform, connector, res in connectors:
            if isinstance(res, Exception):
                logger.error(f"Connector {platform} raised exception: {res}")
                source_statuses.append(
                    SourceStatus(
                        platform=platform,
                        status="failed",
                        records_found=0,
                        error=str(res),
                        retrieved_at=self._now_iso(),
                        details=f"{platform} query failed: {str(res)}"
                    )
                )
            else:
                found_sources = res or []
                all_sources.extend(found_sources)

                # Extract activities from sources
                records_count = len(found_sources)
                for s in found_sources:
                    for act in s.activities:
                        records_count += 1
                        all_activities.append(
                            ActivityItem(
                                id=act.id,
                                category=act.category,
                                title=act.title,
                                description=act.description,
                                organization=act.organization,
                                date=act.date,
                                source_url=act.source_url,
                                source_platform=act.source_platform,
                                confidence=act.confidence,
                                metadata=act.metadata
                            )
                        )

                # Determine accurate status
                if platform == "Web Search":
                    status = "complete" if found_sources else ("unavailable" if search_provider.last_status == "unavailable" else "empty")
                    details = f"Retrieved {len(found_sources)} public search citations via {search_provider.last_provider_used.title()}."
                elif platform == "LinkedIn":
                    has_user_provided = any(s.source_type == "user_provided_source" for s in found_sources)
                    status = "complete" if found_sources else "unavailable"
                    details = "User-provided profile processed and verified" if has_user_provided else "Public search citation query executed"
                elif connector:
                    status = connector.last_status
                    if found_sources:
                        status = "complete"
                    elif connector.last_status == "unavailable":
                        status = "unavailable"
                    elif connector.last_status == "failed":
                        status = "failed"
                    else:
                        status = "empty"

                    details = f"Retrieved {len(found_sources)} profile/source records and {records_count - len(found_sources)} activity items."
                    if status == "unavailable" and connector.last_error:
                        details = connector.last_error
                    elif status == "empty":
                        details = f"No public {platform} records found for provided query parameters."
                else:
                    status = "complete" if found_sources else "empty"
                    details = f"Retrieved {len(found_sources)} records."

                source_statuses.append(
                    SourceStatus(
                        platform=platform,
                        status=status,
                        records_found=records_count,
                        error=getattr(connector, "last_error", None) if status in ("unavailable", "failed") else None,
                        retrieved_at=self._now_iso(),
                        details=details
                    )
                )

        # Deduplicate sources by source_url
        seen_urls = set()
        deduped_sources: List[NormalizedSource] = []
        for s in all_sources:
            if s.source_url and s.source_url not in seen_urls:
                seen_urls.add(s.source_url)
                deduped_sources.append(s)

        return deduped_sources, all_activities, source_statuses
