from fastapi import APIRouter, HTTPException
from app.api.routes_investigate import INVESTIGATIONS_STORE

router = APIRouter()

@router.get("/{investigation_id}/graph")
async def get_graph(investigation_id: str):
    """Returns the graph nodes and edges for an investigation."""
    if investigation_id not in INVESTIGATIONS_STORE:
        raise HTTPException(status_code=404, detail="Investigation not found")
    inv = INVESTIGATIONS_STORE[investigation_id]
    return {
        "nodes": [n.model_dump() for n in inv.graph_nodes],
        "edges": [e.model_dump() for e in inv.graph_edges]
    }

@router.get("/{investigation_id}/timeline")
async def get_timeline(investigation_id: str):
    """Returns chronological timeline milestones."""
    if investigation_id not in INVESTIGATIONS_STORE:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return INVESTIGATIONS_STORE[investigation_id].timeline
