export interface TargetInput {
  name?: string;
  seed_handle?: string;
  email?: string;
  phone?: string;
  website?: string;
  organization?: string;
  affiliation?: string;
  location?: string;
  image_url?: string;
  linkedin_url?: string;
  keywords?: string;
  consent_confirmed: boolean;
  benchmark_id?: string;
  photo?: File | null;
}

export interface SourceStatus {
  platform: string;
  status: 'connected' | 'complete' | 'unavailable' | 'failed' | 'empty' | string;
  records_found: number;
  error?: string | null;
  retrieved_at: string;
  details?: string | null;
}

export interface PublicProfile {
  platform: string;
  username: string;
  display_name: string;
  profile_url: string;
  avatar_url?: string | null;
  bio?: string | null;
  followers_count?: number | null;
  verified_link: boolean;
  evidence_score: number;
  status: 'VERIFIED' | 'SUPPORTED' | 'CONFLICTED' | 'INSUFFICIENT' | string;
  match_reasons: string[];
  supporting_evidence?: string[];
  conflicting_evidence?: string[];
  provenance_sources?: string[];
  recommended_action?: string;
  origin?: 'discovered' | 'user_provided' | string;
}

export interface ActivityItem {
  id: string;
  category: 'Repositories' | 'Hackathons' | 'Conferences' | 'Publications' | 'Patents' | 'Career' | 'Education' | string;
  title: string;
  description: string;
  organization?: string | null;
  date: string;
  source_url: string;
  source_platform: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface CandidatePerson {
  id: string;
  name: string;
  avatar_url?: string | null;
  platform?: string | null;
  username?: string | null;
  profile_url?: string | null;
  organization?: string | null;
  role?: string | null;
  confidence: number;
  matching_evidence: string[];
  conflicting_evidence: string[];
  profiles: PublicProfile[];
  activities?: ActivityItem[];
  is_selected?: boolean;
}

export interface ConflictAnomaly {
  id: string;
  field: string;
  source_a: string;
  value_a: string;
  source_b: string;
  value_b: string;
  severity: 'warning' | 'high' | string;
  explanation: string;
  reconciliation_suggestion: string;
}

export interface ClaimEvidence {
  claim_id: string;
  claim_type: string;
  claim_text: string;
  confidence: number;
  sources: string[];
  supporting_signals: string[];
  status: 'CONFIRMED' | 'LIKELY' | 'UNRESOLVED' | 'CONFLICT';
  retrieval_timestamp: string;
}

export interface GraphNode {
  id: string;
  type: 'target' | 'profile' | 'organization' | 'project' | 'event' | 'publication' | 'patent' | string;
  label: string;
  sublabel?: string | null;
  platform?: string | null;
  confidence?: number | null;
  avatar?: string | null;
  url?: string | null;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  confidence: number;
  evidence_snippet?: string | null;
  source_url?: string | null;
}

export interface ExposureItem {
  id: string;
  source: string;
  category: string;
  reported_date: string;
  description: string;
  impact_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  advisory_url?: string;
  verified_public_notice: boolean;
}

export interface ExposureIntelligence {
  has_exposure: boolean;
  compliance_notice: string;
  total_findings: number;
  domain_checked?: string;
  email_checked?: string;
  items: ExposureItem[];
}

export interface InvestigationResult {
  investigation_id: string;
  target_summary: TargetInput;
  likely_identity: string;
  visual_similarity_score: number;
  overall_confidence: number;
  confidence_breakdown: Record<string, number>;
  profiles: PublicProfile[];
  aliases: string[];
  activities: ActivityItem[];
  timeline: ActivityItem[];
  conflicts: ConflictAnomaly[];
  claims: ClaimEvidence[];
  graph_nodes: GraphNode[];
  graph_edges: GraphEdge[];
  rag_context: string;
  summary_verdict: string;
  source_statuses?: SourceStatus[];
  exposure_intelligence?: ExposureIntelligence | null;
  developer_fingerprint?: {
    languages?: string[];
    frameworks?: string[];
    databases?: string[];
    focus_areas?: string[];
    summary?: string;
  } | null;
  resolution_status?: 'unique' | 'ambiguous' | 'insufficient' | string;
  primary_candidate?: CandidatePerson | null;
  candidates?: CandidatePerson[];
  is_demo?: boolean;
}

export interface BenchmarkItem {
  id: string;
  title: string;
  description: string;
  input: TargetInput;
  confidence: number;
}

export interface CopilotResponse {
  answer: string;
  citations: Array<{ platform: string; url: string }>;
  confidence: number;
}
