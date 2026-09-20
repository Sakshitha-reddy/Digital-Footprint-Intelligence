from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class TargetInput(BaseModel):
    name: Optional[str] = None
    seed_handle: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    affiliation: Optional[str] = None
    location: Optional[str] = None
    keywords: Optional[str] = None
    image_url: Optional[str] = None
    consent_confirmed: bool = True
    benchmark_id: Optional[str] = None
    linkedin_url: Optional[str] = None

class PublicProfile(BaseModel):
    platform: str
    username: str
    display_name: str
    profile_url: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    followers_count: Optional[int] = None
    verified_link: bool = False
    evidence_score: float = 0.0
    status: str = "SUPPORTED"  # "VERIFIED", "SUPPORTED", "CONFLICTED", "INSUFFICIENT"
    match_reasons: List[str] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    conflicting_evidence: List[str] = Field(default_factory=list)
    provenance_sources: List[str] = Field(default_factory=list)
    recommended_action: Optional[str] = None
    origin: str = "discovered"  # "discovered" or "user_provided"

class ActivityItem(BaseModel):
    id: str
    category: str  # Repository, Hackathon, Conference, Publication, Patent, Career, Education
    title: str
    description: str
    organization: Optional[str] = None
    date: str  # YYYY-MM or YYYY
    source_url: str
    source_platform: str
    confidence: float
    metadata: Dict[str, Any] = Field(default_factory=dict)

class CandidatePerson(BaseModel):
    id: str
    name: str
    avatar_url: Optional[str] = None
    platform: Optional[str] = None
    username: Optional[str] = None
    profile_url: Optional[str] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    confidence: int = 0
    matching_evidence: List[str] = Field(default_factory=list)
    conflicting_evidence: List[str] = Field(default_factory=list)
    profiles: List[PublicProfile] = Field(default_factory=list)
    activities: List[ActivityItem] = Field(default_factory=list)
    is_selected: bool = False

class ConflictAnomaly(BaseModel):
    id: str
    field: str
    source_a: str
    value_a: str
    source_b: str
    value_b: str
    severity: str  # "warning", "high"
    explanation: str
    reconciliation_suggestion: str

class ClaimEvidence(BaseModel):
    claim_id: str
    claim_type: str
    claim_text: str
    confidence: int  # 0 - 100
    sources: List[str]
    supporting_signals: List[str]
    status: str  # "CONFIRMED", "LIKELY", "UNRESOLVED", "CONFLICT"
    retrieval_timestamp: str

class GraphNode(BaseModel):
    id: str
    type: str  # target, profile, organization, project, event, publication, patent
    label: str
    sublabel: Optional[str] = None
    platform: Optional[str] = None
    confidence: Optional[float] = None
    avatar: Optional[str] = None
    url: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str  # created, studied_at, worked_at, participated, authored, resolved_alias
    confidence: float
    evidence_snippet: Optional[str] = None
    source_url: Optional[str] = None

class SourceStatus(BaseModel):
    platform: str
    status: str  # "connected", "complete", "unavailable", "failed", "empty"
    records_found: int = 0
    error: Optional[str] = None
    retrieved_at: str
    details: Optional[str] = None

class InvestigationResult(BaseModel):
    investigation_id: str
    target_summary: TargetInput
    likely_identity: str
    visual_similarity_score: float
    overall_confidence: int  # 0 - 100
    confidence_breakdown: Dict[str, float]
    profiles: List[PublicProfile]
    aliases: List[str]
    activities: List[ActivityItem]
    timeline: List[ActivityItem]
    conflicts: List[ConflictAnomaly]
    claims: List[ClaimEvidence]
    graph_nodes: List[GraphNode]
    graph_edges: List[GraphEdge]
    rag_context: str
    summary_verdict: str
    source_statuses: List[SourceStatus] = Field(default_factory=list)
    exposure_intelligence: Optional[Dict[str, Any]] = None
    developer_fingerprint: Optional[Dict[str, Any]] = None
    resolution_status: str = "unique"  # "unique", "ambiguous", "insufficient"
    primary_candidate: Optional[CandidatePerson] = None
    candidates: List[CandidatePerson] = Field(default_factory=list)
    is_demo: bool = False

class CopilotQuery(BaseModel):
    investigation_id: str
    query: str
    history: List[Dict[str, str]] = Field(default_factory=list)

class CopilotResponse(BaseModel):
    answer: str
    citations: List[Dict[str, str]]
    confidence: int
