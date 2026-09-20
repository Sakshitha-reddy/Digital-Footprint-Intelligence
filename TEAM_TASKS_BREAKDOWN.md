# NEURAX Hackathon 3.0 — 3-Person Team Task Breakdown & Work Allocation

**Domain 3: AI in Cybersecurity — Public Profile & Digital Footprint Intelligence**  
**Core Architecture Principle:** `DISCOVER ➔ CORRELATE ➔ VERIFY ➔ EXPLAIN`

---

## 👥 Overview of Work Distribution

| Role | Assignee | Focus Area | Workload Share |
| :--- | :--- | :--- | :---: |
| **Lead Architect & Core Intelligence Engine** | **YOU (Member 1)** | Core Pipeline Orchestrator, Entity Resolution, Bayesian Confidence Engine, NetworkX Graph Topology, Main React OSINT UI & React Flow Canvas | **~55% (Primary / Core)** |
| **OSINT Connectors & Activity UI** | **Member 2** | Live Public API Adapters (GitHub, HN, Dev.to, Wikipedia), Footprint Aggregator, Chronological Timeline & Category Grid UI | **~25% (Modular Backend/UI)** |
| **RAG Copilot, Dossier & Evaluation** | **Member 3** | RAG Investigator Copilot, Strict Citation Engine, Printable Executive Dossier Exporter, Benchmark Evaluation Test Scenarios | **~20% (Copilot & Polish)** |

---

## 🚀 MEMBER 1: YOU (Lead Architect & Core Engine Lead) — 55% OF THE WORK

You are responsible for the intellectual core of the system: resolving fragmented identities, calculating mathematical evidence confidence, managing the central knowledge graph topology, and building the primary interactive cyber dashboard.

### 📁 Files You Own:
1. `backend/app/engines/entity_resolution.py`
2. `backend/app/engines/confidence_engine.py`
3. `backend/app/engines/graph_builder.py`
4. `backend/app/engines/visual_matcher.py`
5. `backend/app/api/routes_investigate.py` & `main.py`
6. `frontend/src/App.tsx`
7. `frontend/src/components/graph/GraphCanvas.tsx` & `CustomNodes.tsx`
8. `frontend/src/components/overview/IdentityHero.tsx` & `SignalsMatrix.tsx`
9. `frontend/src/components/overview/ConflictBanner.tsx`

---

### 🔨 What You Need to Build (Step-by-Step):

#### 1. Multi-Signal Entity Resolution Engine (`entity_resolution.py`)
* **Objective:** Determine if different handles (e.g. `@arjundev`, `@arjun_sec`, `@ak_infosec`) belong to the same person.
* **Components to Implement:**
  * Jaro-Winkler string similarity + Levenshtein distance on normalized handles.
  * Bi-directional cross-link graph check: If personal website `arjun.codes` links to GitHub `@arjundev`, and GitHub links back to `arjun.codes` $\rightarrow$ flag as **$99\%$ deterministic link cycle**.
  * Co-occurrence scoring: Shared organizations (e.g. "IIT Hyderabad"), matching project names (e.g. "GuardFlow").
  * Output: Returns confidence score $[0.0 - 1.0]$ and human-readable explanation strings (`match_reasons`).

#### 2. Bayesian Confidence & Conflict Engine (`confidence_engine.py`)
* **Objective:** Compute explainable mathematical confidence (0-100%) and detect contradictory claims.
* **Components to Implement:**
  * Weighted multi-factor formula:
    $$\text{Score} = (0.28 \times \text{CrossLink}) + (0.22 \times \text{OrgMatch}) + (0.18 \times \text{VisualSim}) + (0.16 \times \text{NameMatch}) + (0.10 \times \text{HandleSim}) + (0.06 \times \text{ActivityOverlap})$$
  * **Explicit Conflict Detector:** Compare location strings and active employment dates. If Source A says *Seattle, WA* and Source B says *Bengaluru, India*, generate a `ConflictAnomaly` alert and apply an explicit penalty (-18 points).
  * **CESV Claim Generator:** Generate structured `ClaimEvidence` cards for every discovered fact with exact timestamps and supporting signals.

#### 3. NetworkX Knowledge Graph Topology (`graph_builder.py`)
* **Objective:** Turn resolved identities into a graph data structure.
* **Components to Implement:**
  * Build a directed graph with central `TargetNode`, branched to `ProfileNodes` (GitHub, X, LinkedIn), `OrganizationNodes`, `ProjectNodes`, `EventNodes`, and `PublicationNodes`.
  * Compute edge weights showing evidence strength ($0.0 - 1.0$).
  * Export in standard format ready for React Flow rendering (`nodes`, `edges`).

#### 4. Frontend Core OSINT Dashboard & React Flow Canvas (`GraphCanvas.tsx`, `App.tsx`)
* **Objective:** The flagship user interface that judges will interact with.
* **Components to Implement:**
  * **Main Dashboard Layout:** Tactical OSINT dark theme (`#070b14` background, cyan neon `#00F0FF`, emerald `#10B981`, amber alert `#F59E0B`).
  * **Interactive Knowledge Graph:** Custom node types with glowing avatar borders, interactive node clicking that opens the evidence drawer, and animated flowing edges.
  * **Identity Hero Card:** Display verified name, multi-platform badges, alias pills, and the animated SVG radial confidence gauge.
  * **Signals Matrix:** Radar/bar visualization showing the mathematical breakdown of the 6 evidence signals.

---

## 🛠️ MEMBER 2: OSINT Connectors & Footprint Activity Stream — 25% OF THE WORK

Member 2 is responsible for connecting external public APIs and presenting the collected digital footprint (repositories, hackathons, papers, events) in an interactive chronological timeline and filterable grid.

### 📁 Files Member 2 Owns:
1. `backend/app/engines/discovery.py`
2. `backend/app/engines/footprint_aggregator.py`
3. `backend/app/core/security.py`
4. `frontend/src/components/timeline/ActivityTimeline.tsx`
5. `frontend/src/components/footprint/FootprintGrid.tsx`
6. `frontend/src/components/footprint/ProfileList.tsx`

---

### 🔨 What Member 2 Needs to Build:

#### 1. Live Public API Connectors (`discovery.py`)
* **Objective:** Fetch public information without authentication walls.
* **Components to Implement:**
  * **GitHub Public API Connector:** Fetch user profile, avatar, bio, company, blog link, and top 6 public repositories with star count and primary languages.
  * **HackerNews Algolia API Connector:** Query public HN submissions and story mentions.
  * **Dev.to API Connector:** Fetch published technical blog posts, tags, and reaction counts.
  * **Wikipedia / DuckDuckGo Instant Answer:** Fetch public entity summaries.

#### 2. Footprint Aggregator (`footprint_aggregator.py`)
* **Objective:** Group raw activities into standard categories and sort chronologically.
* **Categories:** `Repositories`, `Hackathons`, `Conferences`, `Publications`, `Patents`, `Career`, `Education`.
* Sort chronologically (earliest to latest) for the timeline stream.

#### 3. Chronological Activity Timeline UI (`ActivityTimeline.tsx`)
* **Objective:** Beautiful vertical visual timeline with smooth Framer Motion entrance.
* **Components to Implement:**
  * Vertical glowing milestone line with icons for each category (Code icon for GitHub, Trophy for Hackathons, Book for Papers).
  * Filter pills at top: `[All]`, `[Repositories]`, `[Hackathons]`, `[Publications]`, `[Career]`.
  * Direct clickable links to the original public source URLs.

#### 4. Footprint Category Grid (`FootprintGrid.tsx` & `ProfileList.tsx`)
* **Objective:** Card-based view of all discovered digital assets.
* Display repository cards with star/fork badges, publication cards with citation info, and platform account cards with direct "Inspect Source" buttons.

---

## 🧠 MEMBER 3: RAG Copilot, Dossier Exporter & Evaluation Suite — 20% OF THE WORK

Member 3 is responsible for the AI Investigation Copilot, generating the printable Executive PDF/Security Dossier, and curating the benchmark evaluation test suite for live presentations.

### 📁 Files Member 3 Owns:
1. `backend/app/engines/rag_copilot.py`
2. `backend/app/data/benchmarks.py`
3. `backend/app/api/routes_copilot.py`
4. `frontend/src/components/copilot/RagChatDrawer.tsx`
5. `frontend/src/components/export/DossierModal.tsx`
6. `frontend/src/components/intake/TargetIntake.tsx` & `ScanRadarModal.tsx`

---

### 🔨 What Member 3 Needs to Build:

#### 1. RAG Investigation Copilot (`rag_copilot.py` & `RagChatDrawer.tsx`)
* **Objective:** Natural language investigator assistant that answers questions with strict citations.
* **Components to Implement:**
  * Query parser that maps analyst questions (e.g. *"Show hackathons won"*, *"Are there any location conflicts?"*, *"List open source projects"*) to verified evidence records.
  * Generates markdown responses with clickable `[Source: GitHub]` citation chips.
  * Frontend slide-over / floating chat drawer with quick prompt pills (*"Summarize conflicts"*, *"List key projects"*, *"Verify education"*).

#### 2. Executive Intelligence Dossier Exporter (`DossierModal.tsx`)
* **Objective:** 1-click printable PDF / Security Dossier for cybersecurity analysts.
* **Components to Implement:**
  * Modal that formats the entire investigation into a clean, classified-style security brief:
    * Executive Summary & Likely Identity
    * Multi-Signal Confidence Matrix & Radar
    * Consolidated Public Accounts & Aliases
    * Complete Activity & Contribution History
    * Discrepancy & Conflict Log
    * Full Provenance & Citation Index
  * Includes a "Print / Save PDF" button with `@media print` CSS styling for crisp physical printout.

#### 3. Target Intake & Animated Tactical Scanner (`TargetIntake.tsx`, `ScanRadarModal.tsx`)
* **Objective:** User intake form with photo upload, context fields, consent confirmation checkbox, and benchmark picker.
* **Scan Radar Modal:** Full-screen tactical OSINT radar with concentric animated rings, live step progression logs (`[SCANNING GITHUB REPOS...]`, `[RESOLVING CROSS-LINKS...]`, `[CALCULATING CONFIDENCE...]`).

#### 4. Benchmark Evaluation Suite (`benchmarks.py`)
* **Objective:** 4 pre-built edge-case scenarios for live judge presentations:
  1. **Scenario 1 (Multi-Alias Developer)**: Same person with 3 handles across GitHub, X, Scholar.
  2. **Scenario 2 (Identity Disambiguation)**: Common name resolved via college records.
  3. **Scenario 3 (Conflict Anomaly)**: Contradictory location claims (Seattle vs Bengaluru).
  4. **Scenario 4 (Insufficient Evidence)**: False match safety guardrail.

---

## 🔄 API Data Contract (How All 3 Members Connect)

### Main Investigation Endpoint:
* **`POST /api/v1/investigate/run`**
  * **Input Payload:**
    ```json
    {
      "name": "Arjun Kumar",
      "seed_handle": "arjundev",
      "affiliation": "IIT Hyderabad",
      "location": "Hyderabad, India",
      "image_url": "https://images.unsplash.com/photo-...",
      "consent_confirmed": true,
      "benchmark_id": "case_multi_alias"
    }
    ```
  * **Output Schema:** Returns complete `InvestigationResult` with `profiles`, `activities`, `timeline`, `conflicts`, `claims`, `graph_nodes`, `graph_edges`, and `confidence_breakdown`.

### Copilot Endpoint:
* **`POST /api/v1/copilot/query`**
  * **Input:** `{"investigation_id": "inv_123", "query": "What hackathons did they win?"}`
  * **Output:** `{"answer": "...", "citations": [{"platform": "Devpost", "url": "..."}], "confidence": 94}`

---

## ⚡ Quick Start for the Team

```bash
# 1. Start the Backend (FastAPI on Port 8000)
cd NEURAX/backend
./run_backend.sh

# 2. Start the Frontend (Vite React on Port 5173)
cd NEURAX/frontend
npm run dev
```
