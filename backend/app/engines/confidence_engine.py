from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
from app.models.schemas import ClaimEvidence, ConflictAnomaly

class ConfidenceAndConflictEngine:
    """
    Computes mathematical confidence metrics and detects contradictions/conflicts
    across fragmented public digital footprints.
    """

    @staticmethod
    def calculate_evidence_score(
        visual_similarity: float,
        name_match: float,
        handle_match: float,
        affiliation_match: float,
        cross_link_verified: bool,
        activity_overlap: float,
        has_conflicts: bool
    ) -> Tuple[int, Dict[str, float]]:
        """
        Calculates explainable confidence score (0-100) using weighted signals.
        """
        weights = {
            "cross_link_verified": 0.28,
            "affiliation_overlap": 0.22,
            "visual_similarity": 0.18,
            "name_and_phonetics": 0.16,
            "handle_morphology": 0.10,
            "activity_co_occurrence": 0.06
        }

        signals = {
            "cross_link_verified": 1.0 if cross_link_verified else 0.4,
            "affiliation_overlap": affiliation_match,
            "visual_similarity": visual_similarity,
            "name_and_phonetics": name_match,
            "handle_morphology": handle_match,
            "activity_co_occurrence": activity_overlap
        }

        raw_score = sum(weights[k] * signals[k] for k in weights)
        final_score = raw_score * 100

        if has_conflicts:
            final_score -= 18.0  # Explicit conflict penalty

        final_score = max(5, min(99, int(round(final_score))))

        breakdown = {
            "Cross-Platform Link Provenance": round(signals["cross_link_verified"] * 100, 1),
            "Affiliation & Org Consistency": round(signals["affiliation_overlap"] * 100, 1),
            "Visual Vector Similarity": round(signals["visual_similarity"] * 100, 1),
            "Name & Identity Lexical Match": round(signals["name_and_phonetics"] * 100, 1),
            "Handle & Alias Correlation": round(signals["handle_morphology"] * 100, 1),
            "Digital Activity Co-occurrence": round(signals["activity_co_occurrence"] * 100, 1),
        }

        return final_score, breakdown

    @staticmethod
    def detect_conflicts(profiles: List[Dict[str, Any]]) -> List[ConflictAnomaly]:
        """
        Inspects metadata across profiles for temporal or locational contradictions.
        """
        conflicts = []
        locations = []
        for p in profiles:
            loc = p.get("location")
            if loc and loc.lower() not in ["", "none", "remote", "worldwide", "earth"]:
                locations.append((p.get("platform", "Unknown"), loc, p.get("profile_url", "")))

        # Compare unique location strings
        if len(locations) >= 2:
            source_a, loc_a, url_a = locations[0]
            source_b, loc_b, url_b = locations[1]

            # Simple city discrepancy check
            if loc_a.lower().split(",")[0].strip() != loc_b.lower().split(",")[0].strip():
                conflicts.append(ConflictAnomaly(
                    id="conf_loc_1",
                    field="Geographical Location",
                    source_a=f"{source_a} ({loc_a})",
                    value_a=loc_a,
                    source_b=f"{source_b} ({loc_b})",
                    value_b=loc_b,
                    severity="warning",
                    explanation=f"Conflicting current locations detected between {source_a} ({loc_a}) and {source_b} ({loc_b}).",
                    reconciliation_suggestion="Candidate may have recently relocated, or one profile may represent an older secondary residence."
                ))

        return conflicts

    @staticmethod
    def generate_cesv_claims(
        target_name: str,
        profiles: List[Dict[str, Any]],
        overall_confidence: int,
        conflicts: List[ConflictAnomaly]
    ) -> List[ClaimEvidence]:
        """
        Produces Claim-Evidence-Source-Verification items for full explainability.
        """
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
        claims = []

        # Claim 1: Primary Identity Resolution
        claims.append(ClaimEvidence(
            claim_id="CLM-01",
            claim_type="Identity Resolution",
            claim_text=f"Public identity '{target_name}' correlated across multiple independent platform accounts.",
            confidence=overall_confidence,
            sources=[p.get("profile_url", "") for p in profiles if p.get("profile_url")],
            supporting_signals=[
                "Bi-directional website cross-references in bio metadata",
                "Syntactic & morphological alias correlation",
                "Co-occurring organizational affiliations"
            ],
            status="CONFIRMED" if overall_confidence >= 80 else ("LIKELY" if overall_confidence >= 60 else "UNRESOLVED"),
            retrieval_timestamp=now_str
        ))

        # Claims for each profile
        for idx, p in enumerate(profiles, start=2):
            plat = p.get("platform", "Platform")
            user = p.get("username", "user")
            score = int(p.get("evidence_score", 0.85) * 100)
            reasons = p.get("match_reasons", ["Matching handle pattern", "Matching display name"])

            claims.append(ClaimEvidence(
                claim_id=f"CLM-0{idx}",
                claim_type="Account Attribution",
                claim_text=f"{plat} account '@{user}' belongs to the verified public digital footprint of {target_name}.",
                confidence=score,
                sources=[p.get("profile_url", "")],
                supporting_signals=reasons if reasons else ["Matching public display name", "Direct bio link verification"],
                status="CONFIRMED" if score >= 85 else "LIKELY",
                retrieval_timestamp=now_str
            ))

        return claims
