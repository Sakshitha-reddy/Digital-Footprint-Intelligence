import os
import pytest
from app.core.config import Settings

def test_settings_defaults():
    settings = Settings()
    assert settings.API_TIMEOUT == 15.0
    assert settings.MAX_SEARCH_RESULTS == 10
    assert settings.MAX_REQUEST_SIZE > 0
    assert settings.AI_PROVIDER in ("gemini", "openai")

def test_settings_with_no_keys():
    # Simulate environment without external API keys
    old_gh = os.environ.pop("GITHUB_TOKEN", None)
    old_tavily = os.environ.pop("TAVILY_API_KEY", None)
    old_gemini = os.environ.pop("GEMINI_API_KEY", None)
    old_openai = os.environ.pop("OPENAI_API_KEY", None)

    try:
        settings = Settings()
        settings.GITHUB_TOKEN = None
        settings.TAVILY_API_KEY = None
        settings.GEMINI_API_KEY = None
        settings.OPENAI_API_KEY = None
        assert settings.GITHUB_TOKEN is None or settings.GITHUB_TOKEN == ""
        assert settings.has_github_token is False
        assert settings.has_tavily is False
        assert settings.is_search_available is False
        assert settings.is_ai_available is False
    finally:
        if old_gh: os.environ["GITHUB_TOKEN"] = old_gh
        if old_tavily: os.environ["TAVILY_API_KEY"] = old_tavily
        if old_gemini: os.environ["GEMINI_API_KEY"] = old_gemini
        if old_openai: os.environ["OPENAI_API_KEY"] = old_openai
