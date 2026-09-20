import pytest
from app.engines.entity_resolution import EntityResolutionEngine
from app.engines.confidence_engine import ConfidenceAndConflictEngine

def test_jaro_winkler_similarity():
    # Exact
    assert EntityResolutionEngine.jaro_winkler_similarity("alex", "alex") == 1.0
    # High similarity
    sim = EntityResolutionEngine.jaro_winkler_similarity("alexjohnson", "alex_johnson")
    assert sim >= 0.85
    # Empty
    assert EntityResolutionEngine.jaro_winkler_similarity("", "alex") == 0.0

def test_handle_correlation():
    score, reasons = EntityResolutionEngine.correlate_handles("alexj", "alex_j")
    assert score == 1.0
    assert len(reasons) > 0

    score_sub, reasons_sub = EntityResolutionEngine.correlate_handles("alex", "alexdev")
    assert score_sub >= 0.88

def test_candidate_correlation_assessment():
    res = EntityResolutionEngine.evaluate_candidate_correlation(
        candidate_name="Alex Johnson",
        candidate_handle="alexj",
        candidate_org="Apex Labs",
        candidate_bio="Security Engineer at Apex Labs",
        candidate_website="https://alexj.dev",
        target_name="Alex Johnson",
        target_handle="alexj",
        target_affiliation="Apex Labs",
        target_website="https://alexj.dev"
    )
    assert res["status"] == "SUPPORTED"
    assert res["composite_score"] >= 0.80
    assert len(res["signals"]) >= 3

def test_conflict_detection():
    profiles = [
        {"platform": "GitHub", "location": "Bengaluru, India", "profile_url": "https://github.com/a"},
        {"platform": "Dev.to", "location": "Seattle, WA, USA", "profile_url": "https://dev.to/a"}
    ]
    conflicts = ConfidenceAndConflictEngine.detect_conflicts(profiles)
    assert len(conflicts) == 1
    assert conflicts[0].field == "Geographical Location"

# =========================================================================
# TESTS FOR CANDIDATE ENTITY RESOLUTION SPEC (TEST 1 to TEST 7)
# =========================================================================

from app.models.schemas import PublicProfile, ActivityItem, CandidatePerson, TargetInput

def test_url_deduplication():
    """Deduplicates URLs with query params, trailing slashes, www."""
    url1 = "https://github.com/rahulsharma"
    url2 = "https://www.github.com/rahulsharma/"
    url3 = "https://github.com/rahulsharma?tab=repositories"
    assert EntityResolutionEngine.normalize_profile_url(url1) == "https://github.com/rahulsharma"
    assert EntityResolutionEngine.normalize_profile_url(url2) == "https://github.com/rahulsharma"
    assert EntityResolutionEngine.normalize_profile_url(url3) == "https://github.com/rahulsharma"

    profiles = [
        PublicProfile(platform="GitHub", username="rahulsharma", display_name="Rahul Sharma", profile_url=url1),
        PublicProfile(platform="GitHub", username="rahulsharma", display_name="Rahul Sharma", profile_url=url2),
        PublicProfile(platform="GitHub", username="rahulsharma", display_name="Rahul Sharma", profile_url=url3),
    ]
    deduped = EntityResolutionEngine.deduplicate_profiles(profiles)
    assert len(deduped) == 1
    assert deduped[0].profile_url == "https://github.com/rahulsharma"

def test_scenario_1_clear_match():
    """TEST 1: One candidate has significantly stronger evidence (>= 80, margin >= 10). Auto-selects."""
    cand_a = CandidatePerson(id="a", name="Candidate A", confidence=94, profile_url="https://github.com/a")
    cand_b = CandidatePerson(id="b", name="Candidate B", confidence=62, profile_url="https://github.com/b")
    cand_c = CandidatePerson(id="c", name="Candidate C", confidence=48, profile_url="https://github.com/c")

    status, primary, top = EntityResolutionEngine.resolve_candidates([cand_a, cand_b, cand_c])
    assert status == "unique"
    assert primary is not None
    assert primary.id == "a"
    assert primary.is_selected is True
    assert len(top) == 3

def test_scenario_2_two_close_matches():
    """TEST 2: Two similar candidates (margin < 10). Returns both, primary=None, user chooses."""
    cand_a = CandidatePerson(id="a", name="Candidate A", confidence=91, profile_url="https://github.com/a")
    cand_b = CandidatePerson(id="b", name="Candidate B", confidence=88, profile_url="https://github.com/b")

    status, primary, top = EntityResolutionEngine.resolve_candidates([cand_a, cand_b])
    assert status == "ambiguous"
    assert primary is None
    assert len(top) == 2
    assert top[0].id == "a"
    assert top[1].id == "b"

def test_scenario_3_three_close_matches():
    """TEST 3: Three similar candidates. Exactly 3 returned, status ambiguous."""
    cand_a = CandidatePerson(id="a", name="Candidate A", confidence=91, profile_url="https://github.com/a")
    cand_b = CandidatePerson(id="b", name="Candidate B", confidence=88, profile_url="https://github.com/b")
    cand_c = CandidatePerson(id="c", name="Candidate C", confidence=84, profile_url="https://github.com/c")

    status, primary, top = EntityResolutionEngine.resolve_candidates([cand_a, cand_b, cand_c])
    assert status == "ambiguous"
    assert primary is None
    assert len(top) == 3

def test_scenario_4_ten_candidates_capped_to_three():
    """TEST 4: Ten candidates. Only top 3 are kept and returned."""
    cands = [
        CandidatePerson(id=f"c_{i}", name=f"Candidate {i}", confidence=95 - i*3, profile_url=f"https://github.com/{i}")
        for i in range(10)
    ]
    status, primary, top = EntityResolutionEngine.resolve_candidates(cands)
    assert len(top) == 3
    # Top 3 must be highest scores: 95, 92, 89
    assert [c.confidence for c in top] == [95, 92, 89]

def test_scenario_5_multiple_profiles_same_person_grouped():
    """TEST 5: Multiple accounts belonging to the SAME person are grouped into ONE candidate person."""
    p_github = PublicProfile(
        platform="GitHub",
        username="rahulsharma",
        display_name="Rahul Sharma",
        profile_url="https://github.com/rahulsharma",
        bio="Systems Researcher @ BITS Hyderabad | rahulsharma.dev | linkedin.com/in/rahul-sharma",
        verified_link=True
    )
    p_linkedin = PublicProfile(
        platform="LinkedIn",
        username="rahul-sharma",
        display_name="Rahul Sharma",
        profile_url="https://linkedin.com/in/rahul-sharma",
        bio="CS Student at BITS Hyderabad | Personal: rahulsharma.dev",
        verified_link=True
    )
    p_devto = PublicProfile(
        platform="Dev.to",
        username="rahulsharma",
        display_name="Rahul Sharma",
        profile_url="https://dev.to/rahulsharma",
        bio="Articles on Rust & Systems | github.com/rahulsharma",
        verified_link=True
    )
    target = TargetInput(name="Rahul Sharma", affiliation="BITS Hyderabad", consent_confirmed=True)
    candidates = EntityResolutionEngine.group_profiles_into_candidates(
        [p_github, p_linkedin, p_devto],
        [],
        target
    )
    # Must be clustered into ONE person
    assert len(candidates) == 1
    assert len(candidates[0].profiles) == 3
    assert candidates[0].profile_url == "https://github.com/rahulsharma"

def test_scenario_6_same_name_unrelated_people_stay_separate():
    """TEST 6: Same name but unrelated people on same/different platforms without links remain separate."""
    p_person1 = PublicProfile(
        platform="GitHub",
        username="rahul-seattle",
        display_name="Rahul Sharma",
        profile_url="https://github.com/rahul-seattle",
        bio="Engineer at Microsoft Seattle, WA",
        verified_link=False
    )
    p_person2 = PublicProfile(
        platform="GitHub",
        username="rahul-hyderabad",
        display_name="Rahul Sharma",
        profile_url="https://github.com/rahul-hyderabad",
        bio="Student at BITS Pilani Hyderabad Campus",
        verified_link=False
    )
    target = TargetInput(name="Rahul Sharma", consent_confirmed=True)
    candidates = EntityResolutionEngine.group_profiles_into_candidates(
        [p_person1, p_person2],
        [],
        target
    )
    # Different accounts on the same platform without cross-links must NOT be merged
    assert len(candidates) == 2
    assert {c.username for c in candidates} == {"rahul-seattle", "rahul-hyderabad"}

def test_scenario_7_insufficient_evidence():
    """TEST 7: No reliable candidate (< 40%). Returns status insufficient, primary=None."""
    cand = CandidatePerson(
        id="c1",
        name="Alex V.",
        confidence=35,
        profile_url="https://github.com/alex-v-99"
    )
    status, primary, top = EntityResolutionEngine.resolve_candidates([cand])
    assert status == "insufficient"
    assert primary is None

