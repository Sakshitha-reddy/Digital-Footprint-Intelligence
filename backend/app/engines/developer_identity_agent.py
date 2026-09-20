import re
import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple, Set
from pydantic import BaseModel, Field

from app.engines.connectors import (
    GitHubConnector,
    LeetCodeConnector,
    CodeChefConnector,
    CodeforcesConnector,
    TwitterConnector,
    NormalizedSource,
    NormalizedActivity,
)
from app.engines.search_provider import search_provider

logger = logging.getLogger("neurax.developer_identity_agent")

class DeveloperFinding(BaseModel):
    source_platform: str
    source_url: str
    finding_type: str  # profile, competitive_profile, repository_portfolio, social_identity
    identifier: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    summary_stats: Dict[str, Any] = Field(default_factory=dict)
    evidence: List[str] = Field(default_factory=list)
    confidence: float = Field(..., ge=0.0, le=1.0)
    collected_at: str

class DeveloperIdentityReport(BaseModel):
    target_name: Optional[str] = None
    target_handle: Optional[str] = None
    total_findings: int = 0
    findings: List[DeveloperFinding] = Field(default_factory=list)
    formatted_summary: str
    timestamp: str

class DeveloperIdentityDiscoveryAgent:
    """
    NEURAX DEVELOPER IDENTITY DISCOVERY AGENT
    Autonomous intelligence agent for discovering, correlating, and evaluating
    public developer and competitive-programming identities across:
    1. GitHub
    2. LeetCode
    3. CodeChef
    4. Codeforces
    5. X/Twitter
    """

    def __init__(self):
        self.github = GitHubConnector()
        self.leetcode = LeetCodeConnector()
        self.codechef = CodeChefConnector()
        self.codeforces = CodeforcesConnector()
        self.twitter = TwitterConnector()

    async def close(self):
        await asyncio.gather(
            self.github.close(),
            self.leetcode.close(),
            self.codechef.close(),
            self.codeforces.close(),
            self.twitter.close(),
            return_exceptions=True
        )

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def generate_handle_variations(self, seed_handle: Optional[str], name: Optional[str]) -> List[str]:
        """Generate deduplicated set of exact and reasonable username variations."""
        candidates: Set[str] = set()

        if seed_handle:
            clean_h = seed_handle.strip().lstrip("@").lower()
            if clean_h:
                candidates.add(clean_h)
                # Handle digit splits (e.g. shiva123 -> shiva, shiva_123, shiva-123)
                m = re.match(r'^([a-z]+)([0-9]+)$', clean_h)
                if m:
                    base_word, digits = m.group(1), m.group(2)
                    candidates.add(base_word)
                    candidates.add(f"{base_word}_{digits}")
                    candidates.add(f"{base_word}-{digits}")

                # Handle separator swaps
                if "_" in clean_h:
                    candidates.add(clean_h.replace("_", ""))
                    candidates.add(clean_h.replace("_", "-"))
                if "-" in clean_h:
                    candidates.add(clean_h.replace("-", ""))
                    candidates.add(clean_h.replace("-", "_"))

        if name:
            clean_name = re.sub(r'[^a-zA-Z0-9\s]', '', name.lower()).strip()
            parts = clean_name.split()
            if len(parts) == 1 and parts[0]:
                candidates.add(parts[0])
            elif len(parts) >= 2:
                first, last = parts[0], parts[-1]
                candidates.add(f"{first}{last}")
                candidates.add(f"{first}_{last}")
                candidates.add(f"{first}-{last}")
                candidates.add(f"{first[0]}{last}")

        # Limit to reasonable length and non-empty
        filtered = [c for c in candidates if 2 <= len(c) <= 32]
        # Order by priority: seed_handle first if present
        if seed_handle:
            clean_seed = seed_handle.strip().lstrip("@").lower()
            if clean_seed in filtered:
                filtered.remove(clean_seed)
                filtered.insert(0, clean_seed)
        return filtered[:6]

    def compute_match_confidence(
        self,
        source: NormalizedSource,
        target_name: Optional[str],
        seed_handle: Optional[str],
        platform_name: str
    ) -> Tuple[float, List[str]]:
        """
        Multidimensional evidence verification.
        Does NOT assume two accounts belong to the same person merely on handle similarity.
        Compares:
        - Handle match (exact vs variation)
        - Display / Real Name match
        - Bio mentions & technology alignment
        - Location / Organization alignment
        - Cross-platform links in profile
        """
        evidence: List[str] = []
        score = 0.50  # baseline exploratory confidence

        clean_seed = (seed_handle or "").strip().lstrip("@").lower()
        clean_target_name = (target_name or "").strip().lower()
        src_user = (source.username or "").lower()
        src_name = (source.display_name or "").lower()
        src_bio = (source.bio or "").lower()

        # 1. Handle Alignment
        if clean_seed and src_user == clean_seed:
            score += 0.22
            evidence.append(f"Exact handle match: @{source.username}")
        elif clean_seed and (src_user in clean_seed or clean_seed in src_user):
            score += 0.10
            evidence.append(f"Handle variation match: @{source.username}")

        # 2. Name Alignment
        if clean_target_name and clean_target_name in src_name:
            score += 0.20
            evidence.append(f"Name match: '{source.display_name}' matches target '{target_name}'")
        elif clean_target_name and any(part in src_name for part in clean_target_name.split() if len(part) > 2):
            score += 0.10
            evidence.append(f"Partial name similarity with '{source.display_name}'")

        # 3. Bio & Platform Activity Signals
        if source.activities:
            score += 0.08
            evidence.append(f"Active public contributions found ({len(source.activities)} public activities)")

        # 4. Links & Cross-References
        for link in source.links:
            if "github.com" in link and platform_name != "GitHub":
                score += 0.12
                evidence.append(f"Profile cross-references GitHub portfolio: {link}")
            if "x.com" in link or "twitter.com" in link and platform_name != "Twitter / X":
                score += 0.08
                evidence.append("Profile cross-references social identity")

        # 5. Penalties for sparse / dormant accounts
        if not source.activities and not source.bio and not source.organization:
            score -= 0.15
            evidence.append("Minimal public profile activity detected")

        final_conf = max(0.35, min(0.98, round(score, 2)))
        return final_conf, evidence

    async def discover(
        self,
        name: Optional[str] = None,
        username: Optional[str] = None,
        email_domain: Optional[str] = None
    ) -> DeveloperIdentityReport:
        """
        Execute full autonomous multi-platform developer identity discovery.
        """
        target_name = (name or "").strip() or None
        target_handle = (username or "").strip().lstrip("@") or None
        now_iso = self._now_iso()

        variations = self.generate_handle_variations(target_handle, target_name)
        logger.info(f"Developer Identity Agent investigating target: '{target_name}' / '{target_handle}'. Variations: {variations}")

        findings: List[DeveloperFinding] = []
        seen_urls: Set[str] = set()

        # Task 1: GitHub Discovery
        async def check_github():
            for handle in variations:
                try:
                    prof = await self.github.get_profile(handle)
                    if prof and prof.source_url not in seen_urls:
                        seen_urls.add(prof.source_url)
                        conf, ev = self.compute_match_confidence(prof, target_name, target_handle, "GitHub")
                        
                        # Extract repo languages & count
                        repos_count = len(prof.projects)
                        languages = list(set([p.get("language") for p in prof.projects if p.get("language")]))
                        summary = {
                            "repositories": repos_count,
                            "languages": languages,
                            "organizations": [prof.organization] if prof.organization else []
                        }
                        if languages:
                            ev.append(f"Languages: {', '.join(languages[:4])}")
                        if repos_count > 0:
                            ev.append(f"Public repositories: {repos_count}")

                        findings.append(
                            DeveloperFinding(
                                source_platform="GitHub",
                                source_url=prof.source_url,
                                finding_type="repository_portfolio",
                                identifier=f"@{prof.username}",
                                display_name=prof.display_name,
                                avatar_url=prof.avatar_url,
                                bio=prof.bio,
                                organization=prof.organization,
                                summary_stats=summary,
                                evidence=ev,
                                confidence=conf,
                                collected_at=now_iso
                            )
                        )
                        break  # Stop after best candidate match
                except Exception as e:
                    logger.warning(f"GitHub check error for {handle}: {e}")

        # Task 2: LeetCode Discovery
        async def check_leetcode():
            for handle in variations:
                try:
                    prof = await self.leetcode.get_profile(handle)
                    if prof and prof.source_url not in seen_urls:
                        seen_urls.add(prof.source_url)
                        conf, ev = self.compute_match_confidence(prof, target_name, target_handle, "LeetCode")
                        
                        # Stats
                        stats = {}
                        if prof.activities:
                            stats = prof.activities[0].metadata
                            if stats.get("total_solved"):
                                ev.append(f"Solved problems: {stats.get('total_solved')}")
                            if stats.get("contest_rating"):
                                ev.append(f"Contest rating: {stats.get('contest_rating')}")

                        findings.append(
                            DeveloperFinding(
                                source_platform="LeetCode",
                                source_url=prof.source_url,
                                finding_type="competitive_profile",
                                identifier=f"@{prof.username}",
                                display_name=prof.display_name,
                                avatar_url=prof.avatar_url,
                                bio=prof.bio,
                                organization=prof.organization,
                                location=prof.location,
                                summary_stats=stats,
                                evidence=ev,
                                confidence=conf,
                                collected_at=now_iso
                            )
                        )
                        break
                except Exception as e:
                    logger.warning(f"LeetCode check error for {handle}: {e}")

        # Task 3: CodeChef Discovery
        async def check_codechef():
            for handle in variations:
                try:
                    prof = await self.codechef.get_profile(handle)
                    if prof and prof.source_url not in seen_urls:
                        seen_urls.add(prof.source_url)
                        conf, ev = self.compute_match_confidence(prof, target_name, target_handle, "CodeChef")
                        
                        stats = {}
                        if prof.activities:
                            stats = prof.activities[0].metadata
                            if stats.get("rating"):
                                ev.append(f"CodeChef rating: {stats.get('rating')}")

                        findings.append(
                            DeveloperFinding(
                                source_platform="CodeChef",
                                source_url=prof.source_url,
                                finding_type="competitive_profile",
                                identifier=f"@{prof.username}",
                                display_name=prof.display_name,
                                avatar_url=prof.avatar_url,
                                bio=prof.bio,
                                organization=prof.organization,
                                location=prof.location,
                                summary_stats=stats,
                                evidence=ev,
                                confidence=conf,
                                collected_at=now_iso
                            )
                        )
                        break
                except Exception as e:
                    logger.warning(f"CodeChef check error for {handle}: {e}")

        # Task 4: Codeforces Discovery
        async def check_codeforces():
            for handle in variations:
                try:
                    prof = await self.codeforces.get_profile(handle)
                    if prof and prof.source_url not in seen_urls:
                        seen_urls.add(prof.source_url)
                        conf, ev = self.compute_match_confidence(prof, target_name, target_handle, "Codeforces")
                        
                        stats = {}
                        if prof.activities:
                            stats = prof.activities[0].metadata
                            if stats.get("rating"):
                                ev.append(f"Codeforces rating: {stats.get('rating')} ({stats.get('rank')})")

                        findings.append(
                            DeveloperFinding(
                                source_platform="Codeforces",
                                source_url=prof.source_url,
                                finding_type="competitive_profile",
                                identifier=f"@{prof.username}",
                                display_name=prof.display_name,
                                avatar_url=prof.avatar_url,
                                bio=prof.bio,
                                organization=prof.organization,
                                location=prof.location,
                                summary_stats=stats,
                                evidence=ev,
                                confidence=conf,
                                collected_at=now_iso
                            )
                        )
                        break
                except Exception as e:
                    logger.warning(f"Codeforces check error for {handle}: {e}")

        # Task 5: Twitter / X Discovery
        async def check_twitter():
            for handle in variations:
                try:
                    prof = await self.twitter.get_profile(handle)
                    if prof and prof.source_url not in seen_urls:
                        seen_urls.add(prof.source_url)
                        conf, ev = self.compute_match_confidence(prof, target_name, target_handle, "Twitter / X")

                        findings.append(
                            DeveloperFinding(
                                source_platform="Twitter / X",
                                source_url=prof.source_url,
                                finding_type="social_identity",
                                identifier=f"@{prof.username}",
                                display_name=prof.display_name,
                                avatar_url=prof.avatar_url,
                                bio=prof.bio,
                                location=prof.location,
                                summary_stats={"activities_count": len(prof.activities)},
                                evidence=ev,
                                confidence=conf,
                                collected_at=now_iso
                            )
                        )
                        break
                except Exception as e:
                    logger.warning(f"Twitter check error for {handle}: {e}")

        # Run all 5 platform discovery tasks concurrently
        await asyncio.gather(
            check_github(),
            check_leetcode(),
            check_codechef(),
            check_codeforces(),
            check_twitter(),
            return_exceptions=True
        )

        # Build formatted presentation
        target_display = f"{target_name or ''} / {target_handle or ''}".strip(" /")
        lines = [
            "NEURAX DEVELOPER IDENTITY DISCOVERY REPORT",
            "──────────────────────────────────────────",
            f"Target: {target_display}",
            "",
            "DEVELOPER IDENTITY",
            "──────────────────────────────────────────"
        ]

        platform_icons = {
            "GitHub": "🐙 GitHub",
            "LeetCode": "🟢 LeetCode",
            "CodeChef": "🏆 CodeChef",
            "Codeforces": "⚔️ Codeforces",
            "Twitter / X": "𝕏 X / Twitter"
        }

        # Order by priority platforms
        priority_order = ["GitHub", "LeetCode", "CodeChef", "Codeforces", "Twitter / X"]
        findings.sort(key=lambda f: priority_order.index(f.source_platform) if f.source_platform in priority_order else 99)

        for f in findings:
            icon = platform_icons.get(f.source_platform, f.source_platform)
            lines.append(f"\n{icon}")
            lines.append(f"   {f.identifier}")
            
            # Platform specific details
            if f.source_platform == "GitHub":
                repos = f.summary_stats.get("repositories", 0)
                langs = " · ".join(f.summary_stats.get("languages", [])[:4])
                if repos:
                    lines.append(f"   {repos} public repositories")
                if langs:
                    lines.append(f"   {langs}")
            elif f.source_platform == "LeetCode":
                solved = f.summary_stats.get("total_solved")
                rating = f.summary_stats.get("contest_rating")
                if solved:
                    lines.append(f"   {solved} algorithmic challenges solved")
                if rating:
                    lines.append(f"   Contest Rating: {rating}")
            elif f.source_platform == "Codeforces":
                rating = f.summary_stats.get("rating")
                rank = f.summary_stats.get("rank")
                if rating:
                    lines.append(f"   Rating: {rating} ({str(rank).capitalize() if rank else ''})")
            elif f.source_platform == "CodeChef":
                rating = f.summary_stats.get("rating")
                stars = f.summary_stats.get("stars")
                if rating:
                    lines.append(f"   Rating: {rating} {stars or ''}".strip())

            lines.append(f"   Confidence: {int(f.confidence * 100)}%")
            lines.append(f"   [Source: {f.source_url}]")

        if not findings:
            lines.append("\nNo public profiles matched verified threshold across prioritized platforms.")

        formatted_output = "\n".join(lines)

        return DeveloperIdentityReport(
            target_name=target_name,
            target_handle=target_handle,
            total_findings=len(findings),
            findings=findings,
            formatted_summary=formatted_output,
            timestamp=now_iso
        )

# Global singleton
developer_agent = DeveloperIdentityDiscoveryAgent()
