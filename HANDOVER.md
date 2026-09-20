# NEURAX — Handover Until Current Checkpoint

**Date:** 2026-09-19  
**Project:** NEURAX Hackathon 3.0 — Domain 3: AI in Cybersecurity  
**Scope:** Public Profile & Digital Footprint Intelligence prototype

---

## 1. Current Status

The project has a working full-stack prototype scaffold:

- **Backend:** FastAPI server starts successfully on `http://127.0.0.1:8000`.
- **Frontend:** Vite + React + TypeScript dev server starts successfully on `http://localhost:5173`.
- **Frontend dependencies:** Installed successfully with `npm install`.
- **Benchmark pipeline:** Four deterministic benchmark investigations are included for reliable demonstrations.
- **Live mode:** GitHub, Dev.to, HackerNews, and DuckDuckGo public API connectors are present.
- **UI direction:** Cybersecurity analyst dark interface using the requested Impeccable/Taste-inspired visual principles and Framer Motion patterns.

### Running processes at handover

- Backend: Uvicorn on port `8000`
- Frontend: Vite on port `5173`

If either process has stopped, restart using the commands in Section 4.

---

## 2. What Has Been Built

### Backend

| Area | File | Current capability |
|---|---|---|
| Application | `backend/app/main.py` | FastAPI app, CORS, health route, API routers |
| Data contracts | `backend/app/models/schemas.py` | Target, profile, activity, conflict, claim, graph, result, copilot schemas |
| Configuration | `backend/app/core/config.py` | Project settings and optional GitHub token |
| Privacy | `backend/app/core/security.py` | Consent enforcement and basic PII redaction utility |
| Discovery | `backend/app/engines/discovery.py` | GitHub, HackerNews Algolia, Dev.to, DuckDuckGo adapters |
| Entity resolution | `backend/app/engines/entity_resolution.py` | Handle normalization, Jaro-Winkler similarity, cross-link check |
| Confidence | `backend/app/engines/confidence_engine.py` | Weighted evidence score, conflict detection, CESV claims |
| Aggregation | `backend/app/engines/footprint_aggregator.py` | Activity categorization and chronological sorting |
| Graph | `backend/app/engines/graph_builder.py` | Knowledge graph nodes/edges for profiles and activities |
| Visual matcher | `backend/app/engines/visual_matcher.py` | Deterministic prototype visual similarity placeholder |
| Copilot | `backend/app/engines/rag_copilot.py` | Evidence-scoped rule-based responses with citations |
| Benchmarks | `backend/app/data/benchmarks.py` | Multi-alias, disambiguation, conflict, insufficient-evidence scenarios |
| Investigation API | `backend/app/api/routes_investigate.py` | Benchmark and live investigation execution/cache |
| Graph API | `backend/app/api/routes_graph.py` | Graph and timeline retrieval |
| Copilot API | `backend/app/api/routes_copilot.py` | Evidence-grounded query endpoint |

### Frontend

| Area | File | Current capability |
|---|---|---|
| Shell | `frontend/src/App.tsx` | Intake-to-dashboard flow, tab routing, global modals |
| Intake | `frontend/src/components/intake/TargetIntake.tsx` | Context inputs, consent checkbox, benchmark picker |
| Scan modal | `frontend/src/components/intake/ScanRadarModal.tsx` | Animated tactical radar and scan steps |
| Navbar | `frontend/src/components/layout/Navbar.tsx` | System status, new target, copilot, dossier actions |
| Tabs | `frontend/src/components/layout/TabNav.tsx` | Overview, graph, timeline, footprint, evidence tabs |
| Identity hero | `frontend/src/components/overview/IdentityHero.tsx` | Identity, aliases, context, confidence ring |
| Signal matrix | `frontend/src/components/overview/SignalsMatrix.tsx` | Six weighted confidence bars |
| Conflicts | `frontend/src/components/overview/ConflictBanner.tsx` | Side-by-side conflict display and reconciliation suggestion |
| Graph | `frontend/src/components/graph/GraphCanvas.tsx` | React Flow topology canvas, custom edges, minimap, controls |
| Graph nodes | `frontend/src/components/graph/CustomNodes.tsx` | Target, profile, project, event node types |
| Timeline | `frontend/src/components/timeline/ActivityTimeline.tsx` | Filterable chronological activity stream |
| Footprint | `frontend/src/components/footprint/FootprintGrid.tsx` | Categorized public activity cards |
| Profiles | `frontend/src/components/footprint/ProfileList.tsx` | Resolved account cards with source links |
| Evidence | `frontend/src/components/evidence/EvidenceDrawer.tsx` | CESV evidence ledger |
| Source cards | `frontend/src/components/evidence/SourceCard.tsx` | Claim status, confidence, signal list, sources |
| Copilot | `frontend/src/components/copilot/RagChatDrawer.tsx` | Slide-over analyst chat with citation links |
| Dossier | `frontend/src/components/export/DossierModal.tsx` | Printable executive report / Save as PDF |
| Styling | `frontend/src/index.css` and Tailwind config | Dark cyber grid, glass cards, neon accents, print CSS |

---

## 3. How To Use The Prototype

1. Open `http://localhost:5173`.
2. Pick one of the four benchmark scenarios:
   - **Scenario 1:** Multi-Alias AI Security Developer
   - **Scenario 2:** Common Name Disambiguation
   - **Scenario 3:** Anomaly & Conflict Detection
   - **Scenario 4:** Insufficient Evidence Safety Guardrail
3. Confirm consent is checked.
4. Click **Initiate Intelligence Reconnaissance**.
5. Review:
   - Identity and confidence verdict
   - Conflict alerts
   - Signal matrix
   - Knowledge graph
   - Timeline
   - Public profile/activity cards
   - CESV evidence ledger
6. Use **AI Copilot** for evidence-scoped questions.
7. Use **Export Dossier** → **Print / PDF** for the executive report.

### Direct API checks

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/investigate/benchmarks
```

---

## 4. Start Commands

### Backend

```bash
cd /Users/shiva/Desktop/NEURAX/backend
./run_backend.sh
```

Equivalent command:

```bash
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd /Users/shiva/Desktop/NEURAX/frontend
npm run dev
```

### Build check

```bash
cd /Users/shiva/Desktop/NEURAX/frontend
npm run build
```

---

## 5. Team Allocation

Full assignment is in [TEAM_TASKS_BREAKDOWN.md](TEAM_TASKS_BREAKDOWN.md).

### You — Lead / largest work share (~55%)

Own the core technical differentiators and flagship UI:

- `backend/app/engines/entity_resolution.py`
- `backend/app/engines/confidence_engine.py`
- `backend/app/engines/graph_builder.py`
- `backend/app/engines/visual_matcher.py`
- `backend/app/api/routes_investigate.py`
- `backend/app/main.py`
- `frontend/src/App.tsx`
- `frontend/src/components/graph/GraphCanvas.tsx`
- `frontend/src/components/graph/CustomNodes.tsx`
- `frontend/src/components/overview/IdentityHero.tsx`
- `frontend/src/components/overview/SignalsMatrix.tsx`
- `frontend/src/components/overview/ConflictBanner.tsx`

### Member 2 — Public source connectors and footprint UI (~25%)

- `backend/app/engines/discovery.py`
- `backend/app/engines/footprint_aggregator.py`
- `backend/app/core/security.py`
- `frontend/src/components/timeline/ActivityTimeline.tsx`
- `frontend/src/components/footprint/FootprintGrid.tsx`
- `frontend/src/components/footprint/ProfileList.tsx`

### Member 3 — Copilot, dossier, intake and evaluation (~20%)

- `backend/app/engines/rag_copilot.py`
- `backend/app/data/benchmarks.py`
- `backend/app/api/routes_copilot.py`
- `frontend/src/components/copilot/RagChatDrawer.tsx`
- `frontend/src/components/export/DossierModal.tsx`
- `frontend/src/components/intake/TargetIntake.tsx`
- `frontend/src/components/intake/ScanRadarModal.tsx`

### Shared contract

Do not change field names casually. The shared contract is in:

- Backend: `backend/app/models/schemas.py`
- Frontend: `frontend/src/types/intelligence.ts`

The primary API endpoint is:

```text
POST /api/v1/investigate/run
```

The copilot endpoint is:

```text
POST /api/v1/copilot/query
```

---

## 6. Important Limitations / Next Work

This is a prototype, not a production surveillance system. Before final presentation, the team should address:

1. **Visual matcher:** `visual_matcher.py` currently uses deterministic placeholder vectors. Replace with an authorized, consent-aware local model only if the hackathon permits it; never use the score as identity proof by itself.
2. **Live discovery:** Add rate limits, retries, cache, source terms-of-service checks, and per-source provenance. Do not indiscriminately scrape blocked/private services.
3. **Copilot:** Current copilot is rule-based. If adding an LLM, force retrieval-only context, structured citations, and a no-evidence response.
4. **Storage:** Current investigation cache is in memory. Add SQLite/PostgreSQL only if persistence is needed.
5. **Graph layout:** Current React Flow positions are deterministic buckets. Improve with a client-side layout strategy and node filtering.
6. **Testing:** Add backend unit tests for score calculation, conflicts, handle matching, and all four scenarios. Add a frontend build/typecheck CI step.
7. **Security:** Move secrets to environment variables, validate URLs, restrict CORS for deployment, and add request size/rate limits.
8. **Ethics:** Keep the consent gate, public-source-only boundary, uncertainty labels, conflict visibility, and delete-investigation control.

---

## 7. Design References Used

The UI direction follows the requested design references:

- Impeccable: intentional hierarchy, polished product surface, information density without clutter.
- Taste skill: strong visual system, consistent color tokens, restrained cyber aesthetic.
- Framer Motion skill: transform/opacity animation, spring transitions, staggered entrances, `AnimatePresence`, and reduced-motion work should be added before final polish.
- Public APIs directory: source adapters use public API-first discovery rather than indiscriminate scraping.

---

## 8. Current Source Tree (Important Files)

```text
NEURAX/
├── README.md
├── HANDOVER.md
├── TEAM_TASKS_BREAKDOWN.md
├── NEURAX_BUILD_PLAN.md
├── backend/
│   ├── requirements.txt
│   ├── run_backend.sh
│   └── app/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
```

This handover reflects the checkpoint where both local servers started successfully.
