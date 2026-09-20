import pytest
from app.engines.ai_provider import AIProvider
from app.engines.connectors.base import PublicSourceRecord

@pytest.mark.asyncio
async def test_ai_provider_deterministic_fallback():
    provider = AIProvider()
    provider.gemini_key = None
    provider.openai_key = None

    assert provider.is_active is False
    assert provider.get_status() == "rule_based_fallback"

    sources = [
        PublicSourceRecord(
            source_type="profile",
            platform="GitHub",
            title="Alex Johnson",
            url="https://github.com/alexjohnson",
            username="alexjohnson",
            description="Staff Security Engineer",
            confidence=0.95
        ),
        PublicSourceRecord(
            source_type="profile",
            platform="Dev.to",
            title="Alex Dev",
            url="https://dev.to/alexjohnson",
            username="alexjohnson",
            description="Author of 12 security articles",
            confidence=0.88
        )
    ]

    claims = await provider.extract_claims_from_sources("Alex Johnson", "alexjohnson", sources)
    assert len(claims) >= 2
    # Verify strict provenance: all claims MUST cite one of the input URLs
    input_urls = {s.url for s in sources}
    for c in claims:
        assert c["source_url"] in input_urls
        assert "claim" in c
        assert c["status"] in ("supported", "uncertain", "conflicting")

@pytest.mark.asyncio
async def test_ai_provider_rejects_hallucinated_urls():
    provider = AIProvider()
    sources = [
        PublicSourceRecord(
            source_type="profile",
            platform="GitHub",
            title="Alex",
            url="https://github.com/realuser",
            confidence=0.9
        )
    ]

    claims = await provider.extract_claims_from_sources("Alex", "realuser", sources)
    for c in claims:
        assert c["source_url"] == "https://github.com/realuser"
