import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_system_status_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/system/status")
        assert res.status_code == 200
        data = res.json()
        assert "github" in data
        assert "search" in data
        assert "ai" in data
        assert "devto" in data
        assert "hackernews" in data
        assert "duckduckgo" in data
        # Ensure no raw secrets are ever leaked
        assert "TAVILY_API_KEY" not in str(data)
        assert "GITHUB_TOKEN" not in str(data)
        assert "GEMINI_API_KEY" not in str(data)

@pytest.mark.asyncio
async def test_benchmark_investigation_run():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Run Benchmark 1: Multi-Alias AI Security Developer
        payload = {
            "name": "Arjun Kumar",
            "seed_handle": "arjundev",
            "benchmark_id": "case_multi_alias",
            "consent_confirmed": True
        }
        res = await client.post("/api/v1/investigate/run", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["is_demo"] is True
        assert len(data["profiles"]) >= 3
        assert len(data["claims"]) >= 3
        assert data["overall_confidence"] > 0
        assert len(data["source_statuses"]) >= 5

        # Test Copilot query on this benchmark result
        inv_id = data["investigation_id"]
        copilot_res = await client.post("/api/v1/copilot/query", json={
            "investigation_id": inv_id,
            "query": "What repositories or code does this target work on?"
        })
        assert copilot_res.status_code == 200
        copilot_data = copilot_res.json()
        assert "answer" in copilot_data
        assert len(copilot_data["citations"]) > 0

@pytest.mark.asyncio
async def test_aporia_trace_intake_and_exposure_intelligence():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test intake with partial identifiers (e.g. Email + Phone + Org only, no strict mandatory fields)
        payload = {
            "name": "John Smith",
            "email": "john@example.com",
            "seed_handle": "johnsmith_dev",
            "phone": "+1-555-019-2834",
            "website": "https://johnsmith.dev",
            "affiliation": "ABC Technologies",
            "location": "Hyderabad",
            "keywords": "Software developer, Hyderabad",
            "consent_confirmed": True
        }
        res = await client.post("/api/v1/investigate/run", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "exposure_intelligence" in data
        exp = data["exposure_intelligence"]
        assert exp is not None
        assert "compliance_notice" in exp
        # Ethical constraint: Absolutely no stolen passwords or credentials collected or displayed
        assert "no stolen passwords" in exp["compliance_notice"].lower()
        for itm in exp.get("items", []):
            assert "password" not in itm.get("description", "").lower()

        # Check profiles have status and why attribution breakdown
        for p in data["profiles"]:
            assert "status" in p
            assert p["status"] in ("VERIFIED", "SUPPORTED", "CONFLICTED", "INSUFFICIENT")
            assert "supporting_evidence" in p
            assert "provenance_sources" in p

