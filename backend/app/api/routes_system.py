from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/status")
async def get_system_status():
    """
    Returns real availability status for all public sources, search providers, and AI engines.
    NEVER returns secrets, API keys, or raw tokens.
    """
    github_status = "available" if settings.has_github_token else "available_unauthenticated"
    search_status = "available" if settings.has_tavily else "fallback_duckduckgo"
    ai_status = "available" if settings.is_ai_available else "rule_based_fallback"
    instagram_status = "available" if settings.has_apify else "unconfigured"
    twitter_status = "available" if settings.has_apify else "unconfigured"

    return {
        "github": github_status,
        "search": search_status,
        "ai": ai_status,
        "instagram": instagram_status,
        "twitter": twitter_status,
        "devto": "available",
        "hackernews": "available",
        "duckduckgo": "available",
        "linkedin": "user_provided_restricted",
        "providers": {
            "ai_provider": settings.AI_PROVIDER,
            "search_provider": settings.SEARCH_PROVIDER,
            "has_github_token": settings.has_github_token,
            "has_tavily": settings.has_tavily,
            "has_gemini": settings.has_gemini,
            "has_openai": settings.has_openai,
            "has_apify": settings.has_apify,
            "has_supabase": settings.has_supabase,
        }
    }
