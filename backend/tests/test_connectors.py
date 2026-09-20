import pytest
from app.engines.connectors.base import NormalizedSource, NormalizedActivity, PublicSourceRecord
from app.engines.connectors.github_connector import GitHubConnector
from app.engines.search_provider import PublicSearchProvider

def test_source_record_normalization():
    source = NormalizedSource(
        source_id="src_test_1",
        platform="GitHub",
        source_type="profile",
        username="testdev",
        display_name="Test Developer",
        organization="Apex Labs",
        location="San Francisco",
        website="https://testdev.io",
        bio="AI Security Researcher",
        source_url="https://github.com/testdev",
        retrieved_at="2026-03-19T10:00:00Z",
        reliability=0.95
    )

    record = source.to_source_record()
    assert isinstance(record, PublicSourceRecord)
    assert record.platform == "GitHub"
    assert record.username == "testdev"
    assert record.url == "https://github.com/testdev"
    assert record.confidence == 0.95
    assert len(record.extracted_entities) > 0

@pytest.mark.asyncio
async def test_search_provider_fallback_without_keys():
    provider = PublicSearchProvider()
    # If no Tavily key, provider must gracefully fallback or return safe list without crashing
    provider.api_key = None
    results = await provider.search("python security")
    assert isinstance(results, list)

@pytest.mark.asyncio
async def test_search_provider_cache():
    provider = PublicSearchProvider()
    provider.api_key = None
    provider.cache.set("cached_query::10", [{"title": "Cached", "url": "https://example.com", "snippet": "Test", "source": "Cache", "published_date": None}])

    results = await provider.search("cached_query", max_results=10)
    assert len(results) == 1
    assert results[0]["title"] == "Cached"

@pytest.mark.asyncio
async def test_github_connector_unauthenticated_init():
    gh = GitHubConnector()
    assert gh.platform_name == "GitHub"
    assert gh.reliability == 0.95
    await gh.close()

@pytest.mark.asyncio
async def test_instagram_connector_init():
    from app.engines.connectors.instagram_connector import InstagramConnector
    ig = InstagramConnector()
    assert ig.platform_name == "Instagram"
    assert ig.reliability == 0.88
    # Empty query returns empty list safely
    results = await ig.search("")
    assert results == []
    await ig.close()

@pytest.mark.asyncio
async def test_twitter_connector_init():
    from app.engines.connectors.twitter_connector import TwitterConnector
    tw = TwitterConnector()
    assert tw.platform_name == "Twitter / X"
    assert tw.reliability == 0.90
    # Empty query returns empty list safely
    results = await tw.search("")
    assert results == []
    await tw.close()


