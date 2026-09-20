import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import routes_investigate, routes_graph, routes_copilot, routes_system, routes_auth

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("neurax.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Evidence-Driven Public Digital Identity & Digital Footprint Intelligence Platform",
    version="3.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(routes_auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(routes_investigate.router, prefix="/api/v1/investigate", tags=["Investigation"])
app.include_router(routes_graph.router, prefix="/api/v1/graph", tags=["Knowledge Graph"])
app.include_router(routes_copilot.router, prefix="/api/v1/copilot", tags=["RAG Copilot"])
app.include_router(routes_system.router, prefix="/api/v1/system", tags=["System Status"])

@app.get("/")
async def root():
    return {
        "platform": "APORIA TRACE Digital Footprint Intelligence",
        "status": "ONLINE",
        "domain": "AI in Cybersecurity (Hackathon 3.0)",
        "docs": "/api/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "aporia-trace-backend"}
