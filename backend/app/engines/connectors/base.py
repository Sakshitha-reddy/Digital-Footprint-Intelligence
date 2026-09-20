from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class NormalizedActivity(BaseModel):
    id: str
    category: str  # Repositories, Publications, Conferences, Career, Web
    title: str
    description: str
    organization: Optional[str] = None
    date: str
    source_url: str
    source_platform: str
    confidence: float
    metadata: Dict[str, Any] = Field(default_factory=dict)

class NormalizedSource(BaseModel):
    source_id: str
    platform: str
    source_type: str  # profile, repository, article, mention, search_hit
    profile_id: Optional[str] = None
    username: Optional[str] = None
    display_name: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    links: List[str] = Field(default_factory=list)
    activities: List[NormalizedActivity] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    source_url: str
    retrieved_at: str
    freshness: str = "active"  # active, recent, historical, unknown
    reliability: float = 0.80  # 0.0 to 1.0 based on origin authority
    status: str = "success"  # success, unavailable, error, empty
    error_message: Optional[str] = None

    def to_source_record(self) -> "PublicSourceRecord":
        return PublicSourceRecord(
            source_type=self.source_type,
            platform=self.platform,
            title=self.display_name or self.username or self.platform,
            url=self.source_url,
            author=self.display_name,
            username=self.username,
            description=self.bio or f"Public {self.platform} record for @{self.username}",
            date=self.retrieved_at[:10] if self.retrieved_at else None,
            raw_text=self.bio or "",
            extracted_entities=[
                {"type": "organization", "value": self.organization} if self.organization else {},
                {"type": "location", "value": self.location} if self.location else {},
                {"type": "website", "value": self.website} if self.website else {}
            ],
            evidence=[{"signal": a.title, "url": a.source_url} for a in self.activities],
            confidence=self.reliability,
            retrieved_at=self.retrieved_at
        )

class PublicSourceRecord(BaseModel):
    """
    Common normalized internal representation for all public OSINT evidence records.
    """
    source_type: str  # profile, repository, article, search_hit, mention
    platform: str
    title: str
    url: str
    author: Optional[str] = None
    username: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    raw_text: Optional[str] = None
    extracted_entities: List[Dict[str, Any]] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.85
    retrieved_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class ConnectorStatus(BaseModel):
    platform: str
    status: str  # connected, complete, unavailable, failed, empty
    records_found: int = 0
    error: Optional[str] = None
    retrieved_at: str
    details: Optional[str] = None

class BaseConnector(ABC):
    """Abstract base class for all NEURAX / APORIA OSINT data connectors."""

    def __init__(self, platform_name: str, reliability: float = 0.85):
        self.platform_name = platform_name
        self.reliability = reliability

    @abstractmethod
    async def search(self, query: str) -> List[NormalizedSource]:
        """Search public records by freeform query (name, alias, keywords)."""
        pass

    @abstractmethod
    async def get_profile(self, identifier: str) -> Optional[NormalizedSource]:
        """Retrieve a specific profile by exact username or public ID."""
        pass

    @abstractmethod
    async def get_activities(self, identifier: str) -> List[NormalizedActivity]:
        """Retrieve public activities, repositories, or articles."""
        pass

    @abstractmethod
    async def close(self):
        """Clean up HTTP client resources."""
        pass
