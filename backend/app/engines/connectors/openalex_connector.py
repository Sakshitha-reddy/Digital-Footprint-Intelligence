import httpx
import logging
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.openalex")

class OpenAlexConnector(BaseConnector):
    """
    OpenAlex Global Scientific & Research Knowledge Graph Connector.
    Discovers public scientific publications, patents, researcher affiliations,
    and works counts using the OpenAlex public REST API (open access, no key required).
    """

    def __init__(self):
        super().__init__(platform_name="OpenAlex", reliability=0.96)
        self.client = httpx.AsyncClient(
            headers={"User-Agent": "AporiaTrace-OSINT/3.0 (mailto:compliance@aporia-trace.ai)"},
            timeout=settings.API_TIMEOUT,
            follow_redirects=True
        )
        self.last_status = "connected"

    async def close(self):
        await self.client.aclose()

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def search(self, query: str) -> List[NormalizedSource]:
        clean_q = query.strip()
        if not clean_q or len(clean_q) < 3:
            return []

        url = f"https://api.openalex.org/authors?search={urllib.parse.quote(clean_q)}&per-page=2"
        try:
            res = await self.client.get(url)
            if res.status_code == 200:
                data = res.json()
                authors = data.get("results", [])
                results: List[NormalizedSource] = []

                for author in authors:
                    author_id = author.get("id", "").split("/")[-1]
                    name = author.get("display_name", "")
                    works_count = author.get("works_count", 0)
                    cited_by = author.get("cited_by_count", 0)
                    h_index = author.get("summary_stats", {}).get("h_index", 0)
                    affiliations = author.get("affiliations", [])
                    org_name = affiliations[0].get("institution", {}).get("display_name") if affiliations else None

                    bio = f"OpenAlex Academic Profile: {works_count} publications, {cited_by} citations, h-index: {h_index}."
                    profile_url = author.get("id", f"https://openalex.org/authors/{author_id}")

                    activities = []
                    # Add publication activity if author has works
                    if works_count > 0:
                        activities.append(
                            NormalizedActivity(
                                id=f"act_alex_{author_id}",
                                category="Publication",
                                title=f"Scientific Works ({works_count} published, {cited_by} citations)",
                                description=f"Academic research verified via OpenAlex. Primary institution: {org_name or 'Independent'}",
                                organization=org_name or "Academic Research",
                                date="2024-01",
                                source_url=profile_url,
                                source_platform="OpenAlex",
                                confidence=0.95,
                                metadata={
                                    "works_count": works_count,
                                    "citations": cited_by,
                                    "h_index": h_index
                                }
                            )
                        )

                    results.append(
                        NormalizedSource(
                            source_id=f"src_alex_{author_id}",
                            platform="OpenAlex",
                            source_type="academic_profile",
                            profile_id=author_id,
                            username=name,
                            display_name=name,
                            organization=org_name,
                            bio=bio,
                            links=[profile_url],
                            activities=activities,
                            projects=[],
                            source_url=profile_url,
                            retrieved_at=self._now_iso(),
                            freshness="active",
                            reliability=self.reliability,
                            status="success"
                        )
                    )

                self.last_status = "complete" if results else "empty"
                return results
        except Exception as e:
            logger.warning(f"OpenAlex author search failed: {e}")
            self.last_status = "failed"
        return []

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        hits = await self.search(identifier)
        return hits[0] if hits else None

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        prof = await self.get_profile(identifier)
        return prof.activities if prof else []
