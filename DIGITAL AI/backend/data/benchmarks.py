"""
backend/data/benchmarks.py
──────────────────────────
Benchmark scenario definitions for the Digital AI Intelligence Platform.

Scenario types:
  - standard:     Normal, well-corroborated intelligence assessments.
  - high_conf:    High-confidence multi-source corroborated findings.
  - conflict:     Contradictory sources with measurable confidence deltas
                  — triggers adversarial debrief protocol.
  - insufficient: Sparse or low-coverage data flagged for human review
                  before downstream consumption.

Usage:
    python backend/data/benchmarks.py              # prints a summary
    from backend.data.benchmarks import get_scenarios_by_type
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass, asdict, field
from datetime import date
from typing import Literal, List, Optional

# Ensure safe UTF-8 output across platforms
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ── Types ─────────────────────────────────────────────────────────────────────

ScenarioType = Literal["standard", "high_conf", "conflict", "insufficient"]

VALID_TYPES: frozenset[ScenarioType] = frozenset(
    {"standard", "high_conf", "conflict", "insufficient"}
)


@dataclass
class Source:
    """A single intelligence source contributing to a scenario."""
    source_id: str
    title: str
    classification: Literal["TOP SECRET", "SECRET", "CONFIDENTIAL", "UNCLASSIFIED"]
    confidence: float           # 0.0 – 1.0
    date: str                   # ISO 8601
    excerpt: str


@dataclass
class Scenario:
    """
    An intelligence benchmark scenario for evaluation and testing.

    Attributes:
        scenario_id:    Unique identifier.
        name:           Human-readable scenario title.
        type:           One of 'standard', 'high_conf', 'conflict', 'insufficient'.
        description:    Plain-language description of the scenario context.
        sources:        List of contributing intelligence sources.
        expected_output: What a correct analytical response should contain.
        flags:          Optional list of tags (e.g. 'DEBRIEF_REQUIRED', 'HUMAN_REVIEW').
        region:         Geographic focus (optional).
        threat_level:   Assessed threat level (optional).
        metadata:       Arbitrary key/value pairs for extensions.
    """
    scenario_id: str
    name: str
    type: ScenarioType
    description: str
    sources: List[Source]
    expected_output: str
    flags: List[str] = field(default_factory=list)
    region: Optional[str] = None
    threat_level: Optional[str] = None
    metadata: dict = field(default_factory=dict)

    def mean_confidence(self) -> float:
        """Return the arithmetic mean confidence across all sources."""
        if not self.sources:
            return 0.0
        return sum(s.confidence for s in self.sources) / len(self.sources)

    def confidence_delta(self) -> float:
        """
        Return max – min confidence across sources.
        High delta (> 0.3) signals a conflict scenario.
        """
        if not self.sources:
            return 0.0
        confs = [s.confidence for s in self.sources]
        return max(confs) - min(confs)

    def is_flagged(self, flag: str) -> bool:
        """Check if a specific flag is set on this scenario."""
        return flag in self.flags


# ── Standard Scenarios ────────────────────────────────────────────────────────

STANDARD_SCENARIOS: List[Scenario] = [
    Scenario(
        scenario_id="STD-001",
        name="Indo-Pacific Shipping Lane Threat Assessment",
        type="standard",
        description=(
            "Assessment of hostile interdiction risk to commercial shipping lanes in "
            "the South China Sea corridor based on patrol vessel positioning and "
            "recent diplomatic signalling."
        ),
        region="Indo-Pacific",
        threat_level="HIGH",
        sources=[
            Source(
                source_id="SRC-001-A",
                title="Maritime Domain Awareness Report Q3 2026",
                classification="SECRET",
                confidence=0.78,
                date="2026-09-10",
                excerpt=(
                    "Patrol vessel density increased 34% in Sector 7 vs. Q2 baseline. "
                    "AIS transponder disablement events up 12% YoY."
                ),
            ),
            Source(
                source_id="SRC-001-B",
                title="Diplomatic Cable — Embassy Port Moresby",
                classification="CONFIDENTIAL",
                confidence=0.72,
                date="2026-09-14",
                excerpt=(
                    "Host nation officials signal increased nervousness over freedom "
                    "of navigation exercises planned for October 2026."
                ),
            ),
        ],
        expected_output=(
            "Risk to commercial shipping elevated. Recommend advisory notice to "
            "logistics partners and pre-positioning of alternate routing options."
        ),
    ),
    Scenario(
        scenario_id="STD-002",
        name="Economic Fragmentation — G20 Market Divergence",
        type="standard",
        description=(
            "Assessment of deglobalization velocity across 8 at-risk G20 markets "
            "based on trade flow, tariff escalation, and capital flight indicators."
        ),
        region="Global",
        threat_level="ELEVATED",
        sources=[
            Source(
                source_id="SRC-002-A",
                title="WEF Economic Fragmentation Index 2026",
                classification="UNCLASSIFIED",
                confidence=0.84,
                date="2026-08-28",
                excerpt="8 of 20 monitored markets crossed threshold fragmentation index of 6.0.",
            ),
            Source(
                source_id="SRC-002-B",
                title="IMF Capital Flight Monitor — Q3 2026",
                classification="UNCLASSIFIED",
                confidence=0.79,
                date="2026-09-01",
                excerpt=(
                    "Net capital outflows from Tier-B emerging markets accelerated to "
                    "$340B in Q3, highest since 2008."
                ),
            ),
        ],
        expected_output=(
            "Deglobalization timeline advanced by 6–12 months vs prior projections. "
            "FX hedging strategy requires urgent review."
        ),
    ),
]

# ── High-Confidence Scenarios ─────────────────────────────────────────────────

HIGH_CONF_SCENARIOS: List[Scenario] = [
    Scenario(
        scenario_id="HC-001",
        name="APT Infrastructure Compromise — Critical Energy Grid",
        type="high_conf",
        description=(
            "Multi-source corroborated assessment of Advanced Persistent Threat "
            "actors achieving persistent access within energy grid SCADA systems "
            "across three nation-states."
        ),
        region="North America / Western Europe",
        threat_level="CRITICAL",
        sources=[
            Source(
                source_id="SRC-HC-001-A",
                title="CISA Technical Report TR-2026-09",
                classification="CONFIDENTIAL",
                confidence=0.95,
                date="2026-09-05",
                excerpt=(
                    "APT access confirmed in 12 of 15 sampled SCADA environments; "
                    "dwell time median 47 days."
                ),
            ),
            Source(
                source_id="SRC-HC-001-B",
                title="NSA/CSS Cyber Threat Bulletin Q3",
                classification="TOP SECRET",
                confidence=0.92,
                date="2026-09-18",
                excerpt=(
                    "State-actor attribution confidence: 92%. TTPs consistent with "
                    "known cluster designated IRON-TEMPEST."
                ),
            ),
            Source(
                source_id="SRC-HC-001-C",
                title="Five Eyes Joint Advisory — Energy Sector",
                classification="SECRET",
                confidence=0.89,
                date="2026-09-15",
                excerpt=(
                    "All Five Eyes partners independently confirmed IOC overlap "
                    "with IRON-TEMPEST campaign infrastructure."
                ),
            ),
        ],
        expected_output=(
            "Immediate escalation required. Activate Cyber Crisis Protocol. "
            "Notify critical infrastructure operators within 4 hours."
        ),
        flags=["IMMEDIATE_ESCALATION", "EXEC_BRIEF_REQUIRED"],
    ),
    Scenario(
        scenario_id="HC-002",
        name="HUMINT Corroboration — Non-State Actor Operational Preparation",
        type="high_conf",
        description=(
            "Three independent HUMINT sources corroborate imminent operational "
            "preparation by a non-state actor in Region Bravo. Timeline: 60–90 days."
        ),
        region="Region Bravo",
        threat_level="CRITICAL",
        sources=[
            Source(
                source_id="SRC-HC-002-A",
                title="HUMINT Asset Report BRAVO-7",
                classification="TOP SECRET",
                confidence=0.88,
                date="2026-09-16",
                excerpt="Asset observed logistics staging consistent with pre-operational posture.",
            ),
            Source(
                source_id="SRC-HC-002-B",
                title="HUMINT Asset Report BRAVO-12",
                classification="TOP SECRET",
                confidence=0.85,
                date="2026-09-17",
                excerpt="Independent corroboration of leadership communication indicating 60-day timeline.",
            ),
            Source(
                source_id="SRC-HC-002-C",
                title="SIGINT Intercept — KEYHOLE Collection",
                classification="TOP SECRET",
                confidence=0.91,
                date="2026-09-18",
                excerpt="Communications traffic pattern consistent with pre-operation coordination phase.",
            ),
        ],
        expected_output=(
            "60–90 day operational window assessed with HIGH confidence. "
            "Recommend immediate counter-operation planning cycle."
        ),
        flags=["IMMEDIATE_ESCALATION", "COUNTER_OP_REQUIRED"],
    ),
]

# ── Conflict Scenarios ────────────────────────────────────────────────────────
# Scenarios with contradictory source data and high confidence deltas.
# These trigger the Adversarial Debrief Protocol (ADP).

CONFLICT_SCENARIOS: List[Scenario] = [
    Scenario(
        scenario_id="CONF-001",
        name="Contradictory Leadership Assessment — Entity DELTA",
        type="conflict",
        description=(
            "Three intelligence sources present irreconcilably contradictory accounts "
            "of the current leadership composition and decision-making authority within "
            "adversarial Entity DELTA. Confidence delta exceeds threshold (0.38), "
            "indicating possible disinformation seeding or source compromise."
        ),
        region="Region Alpha",
        threat_level="HIGH",
        sources=[
            Source(
                source_id="SRC-CONF-001-A",
                title="HUMINT Report ALPHA-31 — Source Confirmed",
                classification="SECRET",
                confidence=0.84,
                date="2026-09-10",
                excerpt=(
                    "Leader X confirmed in position following internal succession event "
                    "on 2026-09-01. Source has 3-year track record, zero burn rate."
                ),
            ),
            Source(
                source_id="SRC-CONF-001-B",
                title="HUMINT Report ALPHA-12 — Contradictory Account",
                classification="SECRET",
                confidence=0.61,
                date="2026-09-12",
                excerpt=(
                    "Source reports Leader Y assumed control post-September 1 event. "
                    "Contradicts ALPHA-31 directly. Source accessed network only once."
                ),
            ),
            Source(
                source_id="SRC-CONF-001-C",
                title="Open Source — Regional Media Analysis",
                classification="UNCLASSIFIED",
                confidence=0.46,
                date="2026-09-14",
                excerpt=(
                    "Regional outlets report collective leadership structure with no "
                    "single dominant figure — contradicts both HUMINT accounts."
                ),
            ),
        ],
        expected_output=(
            "CONFLICT DETECTED: Three contradictory accounts cannot be reconciled. "
            "Confidence delta: 0.38. Adversarial Debrief Protocol (ADP) must be activated. "
            "Do NOT use these sources for operational planning without resolution."
        ),
        flags=["DEBRIEF_REQUIRED", "ADP_ACTIVATED", "DO_NOT_USE_FOR_OPS"],
        metadata={
            "conflict_type": "leadership_composition",
            "confidence_delta": 0.38,
            "resolution_deadline_days": 14,
            "adb_ticket": "ADP-2026-047",
        },
    ),
    Scenario(
        scenario_id="CONF-002",
        name="Supply Chain Event — Conflicting Timeline Reports",
        type="conflict",
        description=(
            "Two high-classification sources provide contradictory timelines for a "
            "critical supply chain disruption event. SIGINT places the event at T+30 days; "
            "HUMINT places it at T+90 days. The 60-day delta materially affects "
            "contingency planning windows."
        ),
        region="Global / East Asia",
        threat_level="HIGH",
        sources=[
            Source(
                source_id="SRC-CONF-002-A",
                title="SIGINT Assessment — Logistics Network ECHO",
                classification="TOP SECRET",
                confidence=0.87,
                date="2026-09-08",
                excerpt=(
                    "SIGINT pattern analysis of logistics communications indicates "
                    "disruption event likely within 30-day window (late October 2026)."
                ),
            ),
            Source(
                source_id="SRC-CONF-002-B",
                title="HUMINT Report — Supply Chain Insider ECHO-7",
                classification="SECRET",
                confidence=0.76,
                date="2026-09-13",
                excerpt=(
                    "Insider source with facility access reports planned disruption "
                    "scheduled for early January 2027 — 90+ days from now."
                ),
            ),
        ],
        expected_output=(
            "CONFLICT DETECTED: Timeline variance of 60 days between SIGINT and HUMINT. "
            "Confidence delta: 0.11 (moderate). Plan for worst case (T+30). "
            "Escalate to source validation cell for priority reconciliation."
        ),
        flags=["DEBRIEF_REQUIRED", "PLAN_WORST_CASE", "SOURCE_VALIDATION_REQUIRED"],
        metadata={
            "conflict_type": "event_timeline",
            "confidence_delta": 0.11,
            "timeline_variance_days": 60,
            "resolution_deadline_days": 7,
        },
    ),
    Scenario(
        scenario_id="CONF-003",
        name="Disinformation Hypothesis — Temporal Drift Cluster",
        type="conflict",
        description=(
            "A cluster of 5 sources (IDs: #12, #31, #44, #51, #58) exhibits a "
            "systematic temporal drift of 12–16 days in event reporting. This pattern "
            "is consistent with deliberate disinformation seeding — events are reported "
            "accurately but with artificial delay to mislead response timing."
        ),
        region="Region Delta",
        threat_level="ELEVATED",
        sources=[
            Source(
                source_id="SRC-CONF-003-12",
                title="Field Report #12 — Region Delta Surveillance",
                classification="CONFIDENTIAL",
                confidence=0.62,
                date="2026-09-03",
                excerpt="Reports activity consistent with event that ground truth places on 2026-08-19 (15-day lag).",
            ),
            Source(
                source_id="SRC-CONF-003-31",
                title="Field Report #31 — Region Delta Surveillance",
                classification="CONFIDENTIAL",
                confidence=0.52,
                date="2026-09-05",
                excerpt="Reports activity consistent with event that ground truth places on 2026-08-23 (13-day lag).",
            ),
            Source(
                source_id="SRC-CONF-003-44",
                title="Field Report #44 — Region Delta Surveillance",
                classification="CONFIDENTIAL",
                confidence=0.48,
                date="2026-09-07",
                excerpt="Reports activity consistent with event ground truth places on 2026-08-25 (13-day lag).",
            ),
        ],
        expected_output=(
            "DISINFORMATION HYPOTHESIS: Systematic 12–16 day temporal drift detected "
            "across source cluster. Possible deliberate seeding to delay response. "
            "Recommend counterintelligence review and source burn assessment."
        ),
        flags=[
            "DEBRIEF_REQUIRED",
            "DISINFORMATION_HYPOTHESIS",
            "CI_REVIEW_REQUIRED",
            "SOURCE_BURN_ASSESSMENT",
        ],
        metadata={
            "conflict_type": "temporal_drift_disinformation",
            "drift_days_min": 12,
            "drift_days_max": 16,
            "affected_source_ids": ["#12", "#31", "#44", "#51", "#58"],
            "confidence_delta": 0.14,
        },
    ),
]

# ── Insufficient Data Scenarios ───────────────────────────────────────────────
# Scenarios where data is too sparse, stale, or low-coverage for reliable
# analytical output. Flagged for human review before downstream use.

INSUFFICIENT_SCENARIOS: List[Scenario] = [
    Scenario(
        scenario_id="INSUF-001",
        name="Sparse Coverage — Region Gamma Political Transition",
        type="insufficient",
        description=(
            "Following the collapse of allied intelligence-sharing agreements for "
            "Region Gamma, only 2 low-confidence sources are available to assess "
            "an active political transition. Coverage is insufficient to produce "
            "a reliable analytical product."
        ),
        region="Region Gamma",
        threat_level="UNKNOWN",
        sources=[
            Source(
                source_id="SRC-INSUF-001-A",
                title="Open Source — Social Media Aggregation, Region Gamma",
                classification="UNCLASSIFIED",
                confidence=0.32,
                date="2026-09-17",
                excerpt=(
                    "Social media posts suggest public unrest — highly unreliable, "
                    "subject to manipulation. No corroborating closed sources available."
                ),
            ),
            Source(
                source_id="SRC-INSUF-001-B",
                title="Third-Party NGO Field Report — Region Gamma",
                classification="UNCLASSIFIED",
                confidence=0.38,
                date="2026-09-10",
                excerpt=(
                    "NGO workers report 'significant political change' but cannot "
                    "provide specifics. Access severely restricted."
                ),
            ),
        ],
        expected_output=(
            "INSUFFICIENT DATA: Only 2 unclassified, low-confidence sources available. "
            "Mean confidence: 0.35. This scenario CANNOT be used for operational "
            "planning. Human review required before any analytical product is issued."
        ),
        flags=[
            "HUMAN_REVIEW_REQUIRED",
            "DO_NOT_USE_FOR_OPS",
            "COVERAGE_GAP",
            "COLLECTION_TASKING_REQUIRED",
        ],
        metadata={
            "coverage_pct": 15,
            "min_sources_required": 3,
            "min_confidence_required": 0.60,
            "collection_gap_reason": "allied_sharing_collapse",
            "review_sla_hours": 24,
        },
    ),
    Scenario(
        scenario_id="INSUF-002",
        name="Stale Intelligence — Adversary Order of Battle, Region Echo",
        type="insufficient",
        description=(
            "The most recent intelligence on adversary order of battle in Region Echo "
            "is 127 days old — well beyond the 45-day staleness threshold for this "
            "intelligence category. No recent collection has been tasked or received."
        ),
        region="Region Echo",
        threat_level="UNKNOWN",
        sources=[
            Source(
                source_id="SRC-INSUF-002-A",
                title="Order of Battle Assessment — Region Echo (STALE)",
                classification="SECRET",
                confidence=0.21,
                date="2026-05-13",
                excerpt=(
                    "Order of battle as of May 2026. NOTE: This document is 127 days "
                    "old. Adversary disposition may have changed significantly."
                ),
            ),
        ],
        expected_output=(
            "INSUFFICIENT DATA: Single source, 127 days stale (threshold: 45 days). "
            "Effective confidence after staleness decay: 0.21. "
            "Collection re-tasking required. Do not use for current planning."
        ),
        flags=[
            "HUMAN_REVIEW_REQUIRED",
            "STALE_INTELLIGENCE",
            "DO_NOT_USE_FOR_OPS",
            "COLLECTION_RETASKING_REQUIRED",
        ],
        metadata={
            "staleness_days": 127,
            "staleness_threshold_days": 45,
            "decayed_confidence": 0.21,
            "original_confidence": 0.74,
            "review_sla_hours": 12,
        },
    ),
    Scenario(
        scenario_id="INSUF-003",
        name="Low Coverage — Rare Earth Supply Chain Node",
        type="insufficient",
        description=(
            "Intelligence coverage of the critical rare earth processing facility "
            "in Country ZULU is severely limited due to denied area constraints. "
            "Only 18% of required data points have been collected. "
            "Assessment cannot be produced without additional TECHINT collection."
        ),
        region="Country ZULU",
        threat_level="UNKNOWN",
        sources=[
            Source(
                source_id="SRC-INSUF-003-A",
                title="Commercial Satellite Imagery — ZULU Processing Facility",
                classification="UNCLASSIFIED",
                confidence=0.44,
                date="2026-09-12",
                excerpt=(
                    "Partial imagery of facility perimeter; 82% of facility obscured "
                    "by cloud cover. No interior visibility achieved."
                ),
            ),
            Source(
                source_id="SRC-INSUF-003-B",
                title="Trade Data — ZULU Rare Earth Export Statistics",
                classification="UNCLASSIFIED",
                confidence=0.51,
                date="2026-08-31",
                excerpt=(
                    "Export volumes from Country ZULU down 12% vs. Q2. "
                    "Causal attribution cannot be determined from export data alone."
                ),
            ),
        ],
        expected_output=(
            "INSUFFICIENT DATA: Coverage at 18% of required data points. "
            "TECHINT collection tasking required for ZULU facility. "
            "Current sources cannot support causal analysis. Human review mandatory."
        ),
        flags=[
            "HUMAN_REVIEW_REQUIRED",
            "DO_NOT_USE_FOR_OPS",
            "TECHINT_COLLECTION_REQUIRED",
            "DENIED_AREA",
        ],
        metadata={
            "coverage_pct": 18,
            "min_coverage_pct_required": 60,
            "denied_area": True,
            "collection_method_needed": "TECHINT",
            "review_sla_hours": 48,
        },
    ),
]

# ── Master Registry ───────────────────────────────────────────────────────────

ALL_SCENARIOS: List[Scenario] = (
    STANDARD_SCENARIOS
    + HIGH_CONF_SCENARIOS
    + CONFLICT_SCENARIOS
    + INSUFFICIENT_SCENARIOS
)

# ── Helper Functions ──────────────────────────────────────────────────────────


def get_scenarios_by_type(scenario_type: ScenarioType) -> List[Scenario]:
    """
    Return all scenarios matching the given type.

    Args:
        scenario_type: One of 'standard', 'high_conf', 'conflict', 'insufficient'.

    Returns:
        List of matching Scenario objects.

    Raises:
        ValueError: If scenario_type is not a valid type.

    Example:
        >>> conflicts = get_scenarios_by_type("conflict")
        >>> len(conflicts)
        3
    """
    if scenario_type not in VALID_TYPES:
        raise ValueError(
            f"Invalid scenario type '{scenario_type}'. "
            f"Valid types: {sorted(VALID_TYPES)}"
        )
    return [s for s in ALL_SCENARIOS if s.type == scenario_type]


def get_scenario_by_id(scenario_id: str) -> Optional[Scenario]:
    """
    Retrieve a scenario by its unique ID.

    Args:
        scenario_id: The scenario_id string (e.g. 'CONF-001').

    Returns:
        Matching Scenario, or None if not found.
    """
    for scenario in ALL_SCENARIOS:
        if scenario.scenario_id == scenario_id:
            return scenario
    return None


def get_flagged_scenarios(flag: str) -> List[Scenario]:
    """
    Return all scenarios that carry a specific flag.

    Args:
        flag: Flag string (e.g. 'HUMAN_REVIEW_REQUIRED', 'DEBRIEF_REQUIRED').

    Returns:
        List of matching Scenario objects.

    Example:
        >>> flagged = get_flagged_scenarios("DEBRIEF_REQUIRED")
        >>> all(s.is_flagged("DEBRIEF_REQUIRED") for s in flagged)
        True
    """
    return [s for s in ALL_SCENARIOS if s.is_flagged(flag)]


def validate_scenario(scenario: Scenario) -> tuple[bool, list[str]]:
    """
    Validate a scenario against quality rules.

    Rules checked:
      - Must have at least 1 source.
      - All source confidence values must be in [0.0, 1.0].
      - 'conflict' scenarios must have ≥ 2 sources.
      - 'conflict' scenarios must have confidence_delta ≥ 0.10.
      - 'insufficient' scenarios must have mean_confidence ≤ 0.55.
      - 'high_conf' scenarios must have mean_confidence ≥ 0.80.
      - Expected output must be non-empty.

    Returns:
        Tuple of (is_valid: bool, errors: list[str]).
    """
    errors: list[str] = []

    if not scenario.sources:
        errors.append("Scenario must have at least one source.")

    for src in scenario.sources:
        if not 0.0 <= src.confidence <= 1.0:
            errors.append(
                f"Source '{src.source_id}' confidence {src.confidence} "
                f"is out of range [0.0, 1.0]."
            )

    if not scenario.expected_output.strip():
        errors.append("expected_output must not be empty.")

    if scenario.type == "conflict":
        if len(scenario.sources) < 2:
            errors.append("Conflict scenarios must have at least 2 sources.")
        if scenario.confidence_delta() < 0.10:
            errors.append(
                f"Conflict scenario confidence_delta {scenario.confidence_delta():.2f} "
                f"is below minimum threshold of 0.10."
            )

    if scenario.type == "high_conf":
        mc = scenario.mean_confidence()
        if mc < 0.80:
            errors.append(
                f"High-confidence scenario mean_confidence {mc:.2f} "
                f"is below required threshold of 0.80."
            )

    if scenario.type == "insufficient":
        mc = scenario.mean_confidence()
        if mc > 0.55:
            errors.append(
                f"Insufficient scenario mean_confidence {mc:.2f} "
                f"exceeds expected ceiling of 0.55."
            )

    return (len(errors) == 0, errors)


def scenarios_to_dict(scenarios: List[Scenario]) -> list[dict]:
    """Serialize a list of Scenario objects to JSON-compatible dicts."""
    return [asdict(s) for s in scenarios]


# ── CLI Summary ───────────────────────────────────────────────────────────────

def _print_summary() -> None:
    divider = "─" * 70

    print(f"\n{'━' * 70}")
    print(" Digital AI — Intelligence Benchmark Scenarios")
    print(f"{'━' * 70}")
    print(f" Total scenarios: {len(ALL_SCENARIOS)}")
    print(f"   Standard:     {len(STANDARD_SCENARIOS)}")
    print(f"   High-Conf:    {len(HIGH_CONF_SCENARIOS)}")
    print(f"   Conflict:     {len(CONFLICT_SCENARIOS)}")
    print(f"   Insufficient: {len(INSUFFICIENT_SCENARIOS)}")

    for scenario_type in ("standard", "high_conf", "conflict", "insufficient"):
        bucket = get_scenarios_by_type(scenario_type)  # type: ignore[arg-type]
        label = scenario_type.upper().replace("_", "-")
        print(f"\n{divider}")
        print(f" [{label}] — {len(bucket)} scenario(s)")
        print(divider)
        for s in bucket:
            is_valid, errs = validate_scenario(s)
            status = "✅ VALID" if is_valid else f"❌ INVALID ({len(errs)} error(s))"
            print(f"\n  ID:            {s.scenario_id}")
            print(f"  Name:          {s.name}")
            print(f"  Region:        {s.region or 'N/A'}")
            print(f"  Threat Level:  {s.threat_level or 'N/A'}")
            print(f"  Sources:       {len(s.sources)}")
            print(f"  Mean Conf.:    {s.mean_confidence():.0%}")
            print(f"  Conf. Delta:   {s.confidence_delta():.2f}")
            print(f"  Flags:         {', '.join(s.flags) or 'None'}")
            print(f"  Validation:    {status}")
            if not is_valid:
                for err in errs:
                    print(f"    ⚠ {err}")

    print(f"\n{'━' * 70}")
    print(f" Generated: {date.today().isoformat()}")
    print(f"{'━' * 70}\n")


if __name__ == "__main__":
    _print_summary()

    # Quick validation pass — exit non-zero if any scenario fails
    failures = []
    for s in ALL_SCENARIOS:
        ok, errs = validate_scenario(s)
        if not ok:
            failures.append((s.scenario_id, errs))

    if failures:
        print(f"VALIDATION FAILED for {len(failures)} scenario(s):")
        for sid, errs in failures:
            print(f"  {sid}: {errs}")
        sys.exit(1)
    else:
        print(f"All {len(ALL_SCENARIOS)} scenarios passed validation.")
        sys.exit(0)
