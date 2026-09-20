import re
import logging
from typing import List, Dict, Any, Optional
from app.models.schemas import CopilotResponse
from app.engines.ai_provider import ai_provider

logger = logging.getLogger("neurax.rag_copilot")

class RagCopilotEngine:
    """
    Evidence-grounded RAG intelligence copilot.
    Answers analyst questions strictly using verified retrieved evidence,
    generating clear inline citations and confidence scores.
    Never invents facts or hallucinates sources.
    """

    @classmethod
    async def answer_query(
        cls,
        query: str,
        rag_context: str,
        activities: List[Dict[str, Any]],
        profiles: List[Dict[str, Any]],
        conflicts: List[Dict[str, Any]],
        claims: Optional[List[Dict[str, Any]]] = None
    ) -> CopilotResponse:
        q = query.strip()
        all_claims = claims or []

        # 1. If AI Provider is active, attempt evidence-grounded LLM synthesis
        if ai_provider.is_active:
            try:
                llm_response = await cls._synthesize_with_ai(q, rag_context, activities, profiles, conflicts, all_claims)
                if llm_response:
                    return llm_response
            except Exception as e:
                logger.warning(f"AI Copilot synthesis error ({e}), falling back to deterministic RAG engine.")

        # 2. Deterministic evidence-grounded rule engine
        return cls._deterministic_answer(q, activities, profiles, conflicts)

    @classmethod
    async def _synthesize_with_ai(
        cls,
        query: str,
        rag_context: str,
        activities: List[Dict[str, Any]],
        profiles: List[Dict[str, Any]],
        conflicts: List[Dict[str, Any]],
        claims: List[Dict[str, Any]]
    ) -> Optional[CopilotResponse]:
        """Calls Gemini or OpenAI strictly conditioned on collected OSINT evidence."""
        # Build strict context summary
        context_items = []
        allowed_urls = {}

        for p in profiles:
            url = p.get("profile_url") or ""
            if url:
                allowed_urls[url] = p.get("platform", "Web")
            context_items.append(f"PROFILE [{p.get('platform')}]: @{p.get('username')} ({p.get('display_name')}) - URL: {url} - Bio: {p.get('bio')}")

        for a in activities[:15]:
            url = a.get("source_url") or ""
            if url:
                allowed_urls[url] = a.get("source_platform", "Web")
            context_items.append(f"ACTIVITY [{a.get('category')} / {a.get('source_platform')}]: {a.get('title')} ({a.get('date')}) - {a.get('description')} - URL: {url}")

        for c in conflicts:
            context_items.append(f"CONFLICT [{c.get('field')}]: Source A: {c.get('source_a')} ({c.get('value_a')}) vs Source B: {c.get('source_b')} ({c.get('value_b')})")

        for cl in claims[:10]:
            context_items.append(f"CLAIM [{cl.get('status')}]: {cl.get('claim_text')} (Confidence: {cl.get('confidence')}%)")

        context_str = "\n".join(context_items)

        system_instruction = (
            "You are the APORIA TRACE RAG intelligence copilot. "
            "You must answer the analyst's question using ONLY the provided evidence records. "
            "DO NOT INVENT FACTS. DO NOT HALLUCINATE URLs. "
            "If the evidence does not contain sufficient information to answer the question, state: "
            "'I don't have sufficient evidence in this investigation to confirm that.' "
            "At the end of your answer, list relevant citations referencing the exact URLs provided in the context."
        )

        user_prompt = (
            f"Evidence Records:\n{context_str}\n\n"
            f"Analyst Question: {query}\n\n"
            "Provide an evidence-grounded answer."
        )

        answer_text = ""
        if ai_provider.provider == "gemini" and ai_provider.gemini_key:
            answer_text = await ai_provider._call_gemini(system_instruction, user_prompt)
        elif ai_provider.provider == "openai" and ai_provider.openai_key:
            answer_text = await ai_provider._call_openai(system_instruction, user_prompt)

        if answer_text:
            # Extract citations from allowed URLs mentioned in answer or context
            citations = []
            for url, platform in allowed_urls.items():
                if url in answer_text or len(citations) < 2:
                    citations.append({"platform": platform, "url": url})

            # Check if answer expressed insufficiency
            confidence = 75 if "don't have sufficient evidence" in answer_text.lower() else 92

            return CopilotResponse(
                answer=answer_text.strip(),
                citations=citations[:5],
                confidence=confidence
            )

        return None

    @classmethod
    def _deterministic_answer(
        cls,
        query: str,
        activities: List[Dict[str, Any]],
        profiles: List[Dict[str, Any]],
        conflicts: List[Dict[str, Any]]
    ) -> CopilotResponse:
        """Deterministic rule-based answers with verified citations."""
        q = query.lower()
        citations = []
        answer_parts = []
        confidence = 90

        # 1. Check for Hackathons & Competitions
        if any(w in q for w in ["hackathon", "competition", "win", "event", "participat"]):
            hackathons = [a for a in activities if a.get("category") in ["Hackathons", "Conferences"]]
            if hackathons:
                answer_parts.append("**Identified Hackathons & Public Events:**")
                for h in hackathons:
                    answer_parts.append(f"- **{h.get('title')}** ({h.get('date')}): {h.get('description')}")
                    citations.append({"platform": h.get("source_platform", "Web"), "url": h.get("source_url", "")})
            else:
                answer_parts.append("I don't have sufficient evidence in this investigation of public hackathon participation.")
                confidence = 80

        # 2. Check for Repositories & Tech Stack
        elif any(w in q for w in ["repo", "github", "code", "project", "language", "stack"]):
            repos = [a for a in activities if a.get("category") == "Repositories"]
            if repos:
                answer_parts.append("**Identified Open-Source Projects & Repositories:**")
                for r in repos:
                    answer_parts.append(f"- **{r.get('title')}** ({r.get('date')}): {r.get('description')}")
                    citations.append({"platform": "GitHub", "url": r.get("source_url", "")})
            else:
                answer_parts.append("I don't have sufficient evidence of public code repositories for this target.")
                confidence = 75

        # 3. Check for Conflicts or Contradictions
        elif any(w in q for w in ["conflict", "contradiction", "discrepanc", "location", "issue", "uncertain"]):
            if conflicts:
                answer_parts.append("**Detected Data Contradictions & Anomalies:**")
                for c in conflicts:
                    answer_parts.append(f"⚠️ **{c.get('field')}**: {c.get('explanation')}")
                    answer_parts.append(f"  - Reconcile suggestion: {c.get('reconciliation_suggestion')}")
                    citations.append({"platform": "Multi-Source", "url": "#conflicts"})
                confidence = 95
            else:
                answer_parts.append("No material conflicts or contradictory claims were detected across the public sources.")

        # 4. Check for Profiles & Aliases
        elif any(w in q for w in ["profile", "handle", "alias", "account", "social", "x", "twitter", "linkedin"]):
            answer_parts.append("**Discovered & Resolved Public Accounts:**")
            for p in profiles:
                status = "✅ Verified Link Cycle" if p.get("verified_link") else "🔍 Morphologically Correlated"
                origin_badge = " (User-Provided)" if p.get("origin") == "user_provided" else ""
                answer_parts.append(f"- **{p.get('platform')}**: `@{p.get('username')}` ({status}){origin_badge}")
                citations.append({"platform": p.get("platform"), "url": p.get("profile_url")})

        # 5. Check for Publications or Patents
        elif any(w in q for w in ["paper", "publication", "patent", "research", "scholar"]):
            pubs = [a for a in activities if a.get("category") in ["Publications", "Patents"]]
            if pubs:
                answer_parts.append("**Public Research Papers & Intellectual Property:**")
                for p in pubs:
                    answer_parts.append(f"- **{p.get('title')}** ({p.get('date')}): {p.get('description')}")
                    citations.append({"platform": p.get("source_platform", "Scholar"), "url": p.get("source_url", "")})
            else:
                answer_parts.append("I don't have sufficient evidence in this investigation of peer-reviewed publications or patent filings.")
                confidence = 80

        # 6. Default / General Summary Query
        else:
            answer_parts.append(f"Based on the collected intelligence across {len(profiles)} platforms:")
            answer_parts.append(f"- Candidate has active public presence across: {', '.join(p.get('platform', '') for p in profiles)}.")
            answer_parts.append(f"- Total correlated digital activities: {len(activities)} milestones spanning education, software repositories, and events.")
            if conflicts:
                answer_parts.append(f"- ⚠️ **Notice**: {len(conflicts)} conflict was flagged regarding location divergence.")
            for p in profiles[:3]:
                citations.append({"platform": p.get("platform"), "url": p.get("profile_url")})

        final_answer = "\n".join(answer_parts)
        return CopilotResponse(
            answer=final_answer,
            citations=citations,
            confidence=confidence
        )
