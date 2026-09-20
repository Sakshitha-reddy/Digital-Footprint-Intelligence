import os
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("neurax.config")

try:
    from dotenv import load_dotenv
    backend_dir = Path(__file__).resolve().parent.parent.parent
    for candidate in (backend_dir / ".env", backend_dir.parent / ".env"):
        if candidate.exists():
            load_dotenv(candidate)
            logger.info("Loaded backend environment configuration.")
            break
except ImportError:
    pass


class Settings:
    PROJECT_NAME: str = "APORIA TRACE Digital Footprint Intelligence"
    API_V1_STR: str = "/api/v1"
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", os.path.join(DATA_DIR, "users.db"))

    # Backend-only provider credentials.
    GITHUB_TOKEN: Optional[str] = os.getenv("GITHUB_TOKEN", "").strip() or None
    TAVILY_API_KEY: Optional[str] = os.getenv("TAVILY_API_KEY", "").strip() or None
    SERPAPI_API_KEY: Optional[str] = os.getenv("SERPAPI_API_KEY", "").strip() or None
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "").strip() or None
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "").strip() or None
    APIFY_API_TOKEN: Optional[str] = os.getenv("APIFY_API_TOKEN", "").strip() or None

    AI_PROVIDER: str = (os.getenv("AI_PROVIDER", "gemini") or "gemini").lower().strip()
    SEARCH_PROVIDER: str = (os.getenv("SEARCH_PROVIDER", "tavily") or "tavily").lower().strip()
    API_TIMEOUT: float = float(os.getenv("API_TIMEOUT", "15"))
    MAX_SEARCH_RESULTS: int = int(os.getenv("MAX_SEARCH_RESULTS", "10"))
    MAX_REQUEST_SIZE: int = int(os.getenv("MAX_REQUEST_SIZE", str(10 * 1024 * 1024)))

    # Session configuration. Secrets must be supplied by the deployment environment.
    SESSION_COOKIE: str = os.getenv("SESSION_COOKIE", "aporia_session")
    SESSION_TTL_HOURS: int = int(os.getenv("SESSION_TTL_HOURS", "24"))
    SESSION_COOKIE_SECURE: bool = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
    SESSION_COOKIE_SAMESITE: str = os.getenv("SESSION_COOKIE_SAMESITE", "lax")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID", "").strip() or None
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET", "").strip() or None
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback")

    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", "").strip() or None
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME", "").strip() or None
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", "").strip() or None
    SMTP_FROM: Optional[str] = os.getenv("SMTP_FROM", "").strip() or None
    RESET_URL_BASE: str = os.getenv("RESET_URL_BASE", "http://localhost:5173/reset-password")

    @property
    def has_supabase(self) -> bool:
        return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"))

    @property
    def is_google_configured(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET and self.GOOGLE_REDIRECT_URI)

    @property
    def has_github_token(self) -> bool: return bool(self.GITHUB_TOKEN)
    @property
    def has_tavily(self) -> bool: return bool(self.TAVILY_API_KEY)
    @property
    def has_serpapi(self) -> bool: return bool(self.SERPAPI_API_KEY)
    @property
    def has_gemini(self) -> bool: return bool(self.GEMINI_API_KEY)
    @property
    def has_openai(self) -> bool: return bool(self.OPENAI_API_KEY)
    @property
    def has_apify(self) -> bool: return bool(self.APIFY_API_TOKEN)
    @property
    def is_ai_available(self) -> bool:
        return (self.AI_PROVIDER == "gemini" and self.has_gemini) or (self.AI_PROVIDER == "openai" and self.has_openai)
    @property
    def is_search_available(self) -> bool: return self.has_tavily


settings = Settings()
