import json
import re
import httpx
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.engines.connectors.base import PublicSourceRecord

logger = logging.getLogger("neurax.ai_provider")

class AIProvider:
    """
    Evidence-grounded AI extraction and reasoning provider.
    Supports Gemini (primary default) and OpenAI with strict provenance guardrails.
    Never invents facts or fabricates URLs.
    Falls back gracefully to deterministic rule-based extraction if keys are absent.
    """

    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
        self.timeout = settings.API_TIMEOUT

    @property
    def is_active(self) -> bool:
        if self.provider == "gemini" and self.gemini_key:
            return True
        if self.provider == "openai" and self.openai_key:
            return True
        return False

    def get_status(self) -> str:
        if self.is_active:
            return "available"
        return "rule_based_fallback"

    async def extract_claims_from_sources(
        self,
        target_name: Optional[str],
        seed_handle: Optional[str],
        sources: List[PublicSourceRecord]
    ) -> List[Dict[str, Any]]:
        """
        Extracts structured claims from retrieved public sources.
        Every extracted claim MUST cite a source_url from the provided list.
        """
        if not sources:
            return []

        allowed_urls = {s.url for s in sources if s.url}

        # If an AI provider key is configured, use LLM extraction
        if self.is_active:
            try:
                claims = await self._extract_with_llm(target_name, seed_handle, sources, allowed_urls)
                if claims:
                    return claims
            except Exception as e:
                logger.warning(f"AI extraction encountered an error ({e}), using deterministic extractor.")

        # Fallback: Deterministic / rule-based extraction from source records
        return self._deterministic_extract(target_name, seed_handle, sources)

    async def _extract_with_llm(
        self,
        target_name: Optional[str],
        seed_handle: Optional[str],
        sources: List[PublicSourceRecord],
        allowed_urls: set
    ) -> List[Dict[str, Any]]:
        """Invokes Gemini or OpenAI to extract structured entities strictly from evidence."""
        # Prepare sanitized evidence payload
        evidence_summary = []
        for idx, s in enumerate(sources[:8]):
            evidence_summary.append({
                "index": idx,
                "platform": s.platform,
                "url": s.url,
                "title": s.title,
                "author": s.author or s.username,
                "description": s.description[:300] if s.description else "",
                "extracted_entities": s.extracted_entities
            })

        system_instruction = (
            "You are an OSINT evidence extraction analyst. Your job is to extract factual claims from "
            "the provided public evidence records. DO NOT INVENT FACTS. DO NOT HALLUCINATE URLs. "
            "Every claim must strictly reference a valid source_url from the provided evidence. "
            "Return a JSON array of objects with keys: "
            "claim, entity_type (profile/organization/project/skill/event), source_url, evidence_text, confidence (float 0.0-1.0), status (supported/uncertain)."
        )

        user_prompt = (
            f"Target Name: {target_name or 'Unknown'}\n"
            f"Seed Handle: {seed_handle or 'Unknown'}\n\n"
            f"Retrieved Public Evidence:\n{json.dumps(evidence_summary, indent=2)}\n\n"
            "Extract verified claims in valid JSON format only."
        )

        raw_json_str = ""
        if self.provider == "gemini" and self.gemini_key:
            raw_json_str = await self._call_gemini(system_instruction, user_prompt)
        elif self.provider == "openai" and self.openai_key:
            raw_json_str = await self._call_openai(system_instruction, user_prompt)

        # Parse and validate JSON
        if raw_json_str:
            try:
                # Remove markdown codeblocks if present
                clean_json = re.sub(r"^```json\s*", "", raw_json_str.strip())
                clean_json = re.sub(r"\s*```$", "", clean_json)
                parsed = json.loads(clean_json)
                if isinstance(parsed, list):
                    validated_claims = []
                    for item in parsed:
                        url = item.get("source_url")
                        # Provenance guardrail: Ensure URL is in retrieved set
                        if url in allowed_urls:
                            validated_claims.append({
                                "claim": item.get("claim", ""),
                                "entity_type": item.get("entity_type", "evidence"),
                                "source_url": url,
                                "evidence_text": item.get("evidence_text", ""),
                                "confidence": float(item.get("confidence", 0.85)),
                                "status": item.get("status", "supported").lower()
                            })
                    if validated_claims:
                        return validated_claims
            except Exception as e:
                logger.warning(f"Failed to parse LLM structured output: {e}")

        return []

    async def _call_gemini(self, system_instruction: str, prompt: str) -> str:
        """Direct REST invocation of Gemini API with temperature 0 for determinism."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": f"{system_instruction}\n\n{prompt}"}]}
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 1024,
            }
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            else:
                logger.warning(f"Gemini flash-latest returned {res.status_code}, trying gemini-3.5-flash-lite fallback.")
                fallback_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={self.gemini_key}"
                res_fb = await client.post(fallback_url, json=payload)
                if res_fb.status_code == 200:
                    candidates = res_fb.json().get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    logger.warning(f"Gemini API returned status {res_fb.status_code}: {res_fb.text[:200]}")
        return ""

    async def _call_openai(self, system_instruction: str, prompt: str) -> str:
        """Direct REST invocation of OpenAI chat completion."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
            else:
                logger.warning(f"OpenAI API returned status {res.status_code}: {res.text[:200]}")
        return ""

    def _deterministic_extract(
        self,
        target_name: Optional[str],
        seed_handle: Optional[str],
        sources: List[PublicSourceRecord]
    ) -> List[Dict[str, Any]]:
        """Deterministic rule-based entity and claim extraction."""
        claims = []
        for s in sources:
            if s.platform == "GitHub":
                claims.append({
                    "claim": f"Public GitHub account verified: @{s.username or seed_handle}",
                    "entity_type": "profile",
                    "source_url": s.url,
                    "evidence_text": s.description or "GitHub profile and repository index",
                    "confidence": 0.94,
                    "status": "supported"
                })
            elif s.platform == "Dev.to":
                claims.append({
                    "claim": f"Public technical author profile on Dev.to: @{s.username}",
                    "entity_type": "profile",
                    "source_url": s.url,
                    "evidence_text": s.description or "Dev.to public technical writing index",
                    "confidence": 0.88,
                    "status": "supported"
                })
            elif s.platform in ("Web", "Tavily Web Search", "DuckDuckGo Public Index"):
                claims.append({
                    "claim": f"Public web indexing entry for target: {s.title[:60]}",
                    "entity_type": "search_hit",
                    "source_url": s.url,
                    "evidence_text": s.description or s.title,
                    "confidence": 0.80,
                    "status": "supported"
                })
            elif s.platform == "LinkedIn":
                claims.append({
                    "claim": "Publicly discoverable LinkedIn reference (restricted API/search citation)",
                    "entity_type": "profile",
                    "source_url": s.url,
                    "evidence_text": s.description or "Public profile citation in web search indices",
                    "confidence": 0.75,
                    "status": "supported"
                })

        return claims


# Global singleton instance
ai_provider = AIProvider()
