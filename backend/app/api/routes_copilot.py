from fastapi import APIRouter, HTTPException
from app.models.schemas import CopilotQuery, CopilotResponse
from app.api.routes_investigate import INVESTIGATIONS_STORE
from app.engines.rag_copilot import RagCopilotEngine

router = APIRouter()

@router.post("/query", response_model=CopilotResponse)
async def query_copilot(query_data: CopilotQuery):
    """
    Retrieves evidence and answers analyst inquiries with strict citations.
    """
    if query_data.investigation_id not in INVESTIGATIONS_STORE:
        raise HTTPException(status_code=404, detail="Investigation ID not found")

    inv = INVESTIGATIONS_STORE[query_data.investigation_id]

    response = await RagCopilotEngine.answer_query(
        query=query_data.query,
        rag_context=inv.rag_context,
        activities=[a.model_dump() for a in inv.activities],
        profiles=[p.model_dump() for p in inv.profiles],
        conflicts=[c.model_dump() for c in inv.conflicts],
        claims=[c.model_dump() for c in inv.claims]
    )
    return response
