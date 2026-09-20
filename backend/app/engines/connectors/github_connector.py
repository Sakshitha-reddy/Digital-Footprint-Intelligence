import httpx
import urllib.parse
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.engines.connectors.base import BaseConnector, NormalizedSource, NormalizedActivity

logger = logging.getLogger("neurax.connectors.github")

class GitHubConnector(BaseConnector):
    """
    Official GitHub REST API Connector for permitted public records.
    Supports user profile retrieval, candidate search, organization memberships,
    and public repository metadata. Configurable via GITHUB_TOKEN environment variable.
    """

    def __init__(self):
        super().__init__(platform_name="GitHub", reliability=0.95)
        self.token = settings.GITHUB_TOKEN
        self.timeout = settings.API_TIMEOUT
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AporiaTrace-OSINT/3.0",
        }
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"
            logger.info("GitHub connector initialized with authenticated token.")
        else:
            logger.info("GitHub connector initialized in unauthenticated public mode (rate limits apply).")

        self.client = httpx.AsyncClient(headers=self.headers, timeout=self.timeout, follow_redirects=True)
        self.last_status = "connected" if self.token else "available_unauthenticated"
        self.last_error: Optional[str] = None

    async def close(self):
        await self.client.aclose()

    def _format_timestamp(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Fetch exact GitHub profile by username."""
        clean_user = identifier.strip().lstrip("@")
        if not clean_user:
            return None

        url = f"https://api.github.com/users/{clean_user}"
        try:
            res = await self.client.get(url)
            if res.status_code == 200:
                data = res.json()
                self.last_status = "complete"

                # Fetch repos & organizations for this user
                activities = await self.get_activities(clean_user)
                orgs = await self.get_organizations(clean_user)
                company = data.get("company") or (", ".join(orgs[:3]) if orgs else None)

                # Append organization membership activities
                for org in orgs:
                    activities.append(
                        NormalizedActivity(
                            id=f"act_gh_org_{clean_user}_{org}",
                            category="Career",
                            title=f"Member of @{org}",
                            description=f"Public GitHub organization affiliation with @{org}",
                            organization=org,
                            date="2024-01",
                            source_url=f"https://github.com/{org}",
                            source_platform="GitHub",
                            confidence=0.92,
                            metadata={"type": "organization"}
                        )
                    )

                links = []
                if data.get("blog"):
                    blog = data["blog"]
                    if not blog.startswith("http"):
                        blog = f"https://{blog}"
                    links.append(blog)

                source = NormalizedSource(
                    source_id=f"src_gh_{data.get('id', clean_user)}",
                    platform="GitHub",
                    source_type="profile",
                    profile_id=str(data.get("id", "")),
                    username=data.get("login", clean_user),
                    display_name=data.get("name") or data.get("login"),
                    organization=company,
                    location=data.get("location"),
                    website=data.get("blog"),
                    bio=data.get("bio"),
                    avatar_url=data.get("avatar_url"),
                    links=links,
                    activities=activities,
                    projects=[
                        {
                            "name": a.title,
                            "description": a.description,
                            "url": a.source_url,
                            "language": a.metadata.get("language"),
                            "stars": a.metadata.get("stars", 0),
                        }
                        for a in activities
                    ],
                    source_url=data.get("html_url", f"https://github.com/{clean_user}"),
                    retrieved_at=self._format_timestamp(),
                    freshness="active" if data.get("updated_at") else "historical",
                    reliability=self.reliability,
                    status="success"
                )
                return source

            elif res.status_code in (403, 429):
                self.last_status = "unavailable"
                self.last_error = "GitHub API rate limit exceeded (60 req/hr unauthenticated). Set GITHUB_TOKEN in backend env for 5,000 req/hr."
                logger.warning(self.last_error)
                return None
            elif res.status_code == 404:
                return None
            else:
                self.last_status = "failed"
                self.last_error = f"GitHub API error HTTP {res.status_code}"
                return None

        except Exception as e:
            self.last_status = "failed"
            self.last_error = f"GitHub request failed: {str(e)}"
            logger.error(self.last_error)
            return None

    async def search(self, query: str, email: Optional[str] = None) -> List[NormalizedSource]:
        """
        Search GitHub for public user accounts matching an email, username, or name.
        Uses authenticated GitHub API token for 5,000 req/hr.
        """
        results: List[NormalizedSource] = []
        seen_logins = set()

        # Strategy 1: Search by email if provided
        if email and "@" in email:
            clean_email = email.strip()
            url = f"https://api.github.com/search/users?q={urllib.parse.quote(clean_email)}+in:email&per_page=3"
            try:
                res = await self.client.get(url)
                if res.status_code == 200:
                    for item in res.json().get("items", []):
                        login = item.get("login")
                        if login and login not in seen_logins:
                            seen_logins.add(login)
                            prof = await self.get_profile(login)
                            if prof:
                                results.append(prof)
            except Exception as e:
                logger.debug(f"GitHub email search failed: {e}")

        # Strategy 2: Search by handle/name query
        clean_q = query.strip().lstrip("@")
        if clean_q:
            # 2a. Attempt exact username match first
            if clean_q not in seen_logins:
                exact = await self.get_profile(clean_q)
                if exact:
                    seen_logins.add(exact.username)
                    results.append(exact)

            # 2b. Search GitHub users endpoint if no exact match yet
            if not results:
                search_queries = [clean_q]
                # If query contains spaces (e.g. "first last"), also try parts
                parts = clean_q.split()
                if len(parts) > 1:
                    search_queries.append("".join(parts))  # e.g. bethalamanohar

                for sq in search_queries:
                    if results:
                        break
                    url = f"https://api.github.com/search/users?q={urllib.parse.quote(sq)}&per_page=3"
                    try:
                        res = await self.client.get(url)
                        if res.status_code == 200:
                            items = res.json().get("items", [])
                            for item in items[:2]:
                                login = item.get("login")
                                if login and login not in seen_logins:
                                    seen_logins.add(login)
                                    prof = await self.get_profile(login)
                                    if prof:
                                        results.append(prof)
                                    else:
                                        results.append(
                                            NormalizedSource(
                                                source_id=f"src_gh_{item.get('id', login)}",
                                                platform="GitHub",
                                                source_type="profile",
                                                profile_id=str(item.get("id", "")),
                                                username=login,
                                                display_name=login,
                                                avatar_url=item.get("avatar_url"),
                                                bio="Discovered via GitHub public user search index.",
                                                links=[item.get("html_url", f"https://github.com/{login}")],
                                                activities=[],
                                                projects=[],
                                                source_url=item.get("html_url", f"https://github.com/{login}"),
                                                retrieved_at=self._format_timestamp(),
                                                freshness="active",
                                                reliability=self.reliability,
                                                status="success"
                                            )
                                        )
                        elif res.status_code in (403, 429):
                            self.last_status = "unavailable"
                            self.last_error = "GitHub Search rate limit reached."
                            logger.warning(self.last_error)
                            break
                    except Exception as e:
                        logger.warning(f"GitHub search query '{sq}' failed: {e}")

        if results:
            self.last_status = "complete"
            self.last_error = None
        elif not self.last_error:
            self.last_status = "empty"
            self.last_error = f"No public GitHub profile found for '{clean_q}'"
        return results

    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        """Fetch up to 10 most recent public repositories for this GitHub user."""
        clean_user = identifier.strip().lstrip("@")
        url = f"https://api.github.com/users/{clean_user}/repos?sort=updated&per_page=10"
        try:
            res = await self.client.get(url)
            if res.status_code == 200:
                repos = res.json()
                activities: List[NormalizedActivity] = []
                for idx, r in enumerate(repos):
                    if not isinstance(r, dict):
                        continue
                    repo_name = r.get("name", "repository")
                    updated = r.get("updated_at", "")[:10]
                    activities.append(
                        NormalizedActivity(
                            id=f"act_gh_{clean_user}_{idx}",
                            category="Repositories",
                            title=repo_name,
                            description=r.get("description") or f"Public GitHub repository by @{clean_user}",
                            organization="GitHub",
                            date=updated[:7] if updated else "2025-01",
                            source_url=r.get("html_url", f"https://github.com/{clean_user}/{repo_name}"),
                            source_platform="GitHub",
                            confidence=0.95,
                            metadata={
                                "language": r.get("language") or "Code",
                                "stars": r.get("stargazers_count", 0),
                                "forks": r.get("forks_count", 0),
                                "topics": r.get("topics", []),
                                "is_fork": r.get("fork", False),
                                "created_at": r.get("created_at", "")[:10],
                            }
                        )
                    )
                return activities
            return []
        except Exception as e:
            logger.warning(f"Failed to fetch repos for {identifier}: {e}")
            return []

    async def get_organizations(self, identifier: str) -> List[str]:
        """Fetch public organization memberships for a user."""
        clean_user = identifier.strip().lstrip("@")
        url = f"https://api.github.com/users/{clean_user}/orgs"
        try:
            res = await self.client.get(url)
            if res.status_code == 200:
                orgs = res.json()
                return [o.get("login") for o in orgs if isinstance(o, dict) and o.get("login")]
        except Exception as e:
            logger.debug(f"Could not retrieve GitHub orgs for {identifier}: {e}")
        return []
