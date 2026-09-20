import pytest
from app.engines.identity_ml import identity_ml_engine, FEATURE_NAMES
from app.models.schemas import PublicProfile, TargetInput, CandidatePerson
from app.engines.entity_resolution import EntityResolutionEngine
from app.engines.graph_builder import GraphTopologyBuilder

def test_feature_names_and_model_initialization():
    assert len(FEATURE_NAMES) == 9
    assert "name_similarity" in FEATURE_NAMES
    assert "username_similarity" in FEATURE_NAMES
    assert "cross_profile_link" in FEATURE_NAMES
    assert "website_match" in FEATURE_NAMES
    assert identity_ml_engine.model is not None

def test_ml_prediction_strong_match():
    features = {
        "name_similarity": 0.95,
        "username_similarity": 1.0,
        "bio_similarity": 0.80,
        "website_match": 1.0,
        "cross_profile_link": 1.0,
        "organization_match": 1.0,
        "location_match": 1.0,
        "avatar_similarity": 0.85,
        "email_domain_match": 1.0,
    }
    proba, verdict, signals = identity_ml_engine.predict_match(features)
    assert proba >= 0.90
    assert "model-supported match" in verdict
    assert any("reciprocal/transit link" in s.lower() for s in signals)

def test_ml_prediction_imposter_handle_collision():
    features = {
        "name_similarity": 0.20,
        "username_similarity": 0.95,
        "bio_similarity": 0.05,
        "website_match": 0.0,
        "cross_profile_link": 0.0,
        "organization_match": 0.0,
        "location_match": 0.0,
        "avatar_similarity": 0.10,
        "email_domain_match": 0.0,
    }
    proba, verdict, signals = identity_ml_engine.predict_match(features)
    assert proba <= 0.45

def test_cross_platform_transitive_link_graph():
    # Target: Shiva Kumar
    # GitHub: shiva-dev, mentions website: shiva.dev
    # Codeforces: shiva123, mentions website: shiva.dev
    p_gh = PublicProfile(
        platform="GitHub",
        username="shiva-dev",
        display_name="Shiva Kumar",
        profile_url="https://github.com/shiva-dev",
        bio="AI Engineer & Competitive Programmer | https://shiva.dev",
        website="https://shiva.dev",
        evidence_score=0.95
    )
    p_cf = PublicProfile(
        platform="Codeforces",
        username="shiva123",
        display_name="Shiva",
        profile_url="https://codeforces.com/profile/shiva123",
        bio="Student coder. Portfolio: https://shiva.dev",
        website="https://shiva.dev",
        evidence_score=0.90
    )

    nodes, edges = GraphTopologyBuilder.build_topology(
        target_name="Shiva Kumar",
        target_avatar="https://example.com/avatar.jpg",
        profiles=[p_gh, p_cf],
        activities=[],
        affiliation="Tech Corp"
    )

    # Verify authoritative domain node was created
    web_nodes = [n for n in nodes if n.properties.get("is_personal_website")]
    assert len(web_nodes) == 1
    assert web_nodes[0].label == "shiva.dev"

    # Verify transitive link edge connects both accounts via shared domain
    trans_edges = [e for e in edges if e.relationship == "transitive_domain_link"]
    assert len(trans_edges) >= 1
    assert trans_edges[0].confidence >= 0.95

def test_candidate_handle_variations():
    from app.engines.discovery import PublicDiscoveryEngine
    variations = PublicDiscoveryEngine.generate_candidate_handles(
        seed_handle="shiva123",
        name="Shiva Kumar"
    )
    assert "shiva123" in variations
    assert "shiva" in variations
    assert any("shiva" in v for v in variations)
    assert len(variations) <= 8
