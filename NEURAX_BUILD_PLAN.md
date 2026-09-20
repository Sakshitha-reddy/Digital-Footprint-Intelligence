# NEURAX v3.0 — Team Build Plan & Task Tracker
**Hackathon 3.0 · AI in Cybersecurity · Digital Footprint Intelligence**

> ✅ = Done · 🔴 = Must Build · 🟡 = Quick Fix  
> Check off tasks as you finish them.

---

# 🧑💻 PERSON 1 — SHIVA (Lead Architect) — ~55% of the work

You own: the app shell, the interactive knowledge graph, the evidence audit panel, and Tailwind fixes.
Everything else connects through your `App.tsx`, so **build main.tsx + App.tsx first**.

## Already Done (your files that are finished):
- [x] `backend/app/engines/entity_resolution.py` — Jaro-Winkler, handle normalization, cross-link verify
- [x] `backend/app/engines/confidence_engine.py` — Bayesian weighted score, conflict detection, CESV claims
- [x] `backend/app/engines/graph_builder.py` — NetworkX topology → GraphNode/GraphEdge export
- [x] `backend/app/engines/visual_matcher.py` — Numpy cosine similarity avatar matching
- [x] `backend/app/api/routes_investigate.py` — POST /run (benchmark + live), GET /{id}, GET /benchmarks
- [x] `backend/app/main.py` — FastAPI app, CORS, 3 routers registered
- [x] `frontend/src/components/overview/IdentityHero.tsx` — Avatar, aliases, SVG confidence gauge
- [x] `frontend/src/components/overview/SignalsMatrix.tsx` — 6-signal evidence breakdown grid
- [x] `frontend/src/components/overview/ConflictBanner.tsx` — Amber conflict alert cards

## Tasks To Build:

### Task P1-1: 🟡 Fix Tailwind config — add missing color tokens
**File:** `frontend/tailwind.config.js`
- [ ] Add `'cyber-border': '#172540'` to theme.extend.colors
- [ ] Add `'cyber-cyan': '#00F0FF'` to theme.extend.colors
- [ ] Without this, **every existing component will crash** on missing class names

### Task P1-2: 🔴 Create app entry point
**File:** `frontend/src/main.tsx`
- [ ] `import React from 'react'`
- [ ] `import ReactDOM from 'react-dom/client'`
- [ ] `import './index.css'`
- [ ] `import App from './App'`
- [ ] `ReactDOM.createRoot(document.getElementById('root')!).render(<App />)`
- **~5 lines, takes 2 minutes, but nothing renders without it**

### Task P1-3: 🔴 Build the main application shell ← MOST IMPORTANT FILE
**File:** `frontend/src/App.tsx`
- [ ] State management:
  - `result: InvestigationResult | null`
  - `activeTab: TabType` (from TabNav)
  - `isScanning: boolean`
  - `showDossier: boolean`
  - `showCopilot: boolean`
  - `benchmarks: BenchmarkItem[]`
  - `error: string | null`
- [ ] On mount: fetch benchmarks via `apiService.fetchBenchmarks()`
- [ ] `handleInvestigate(input)`: isScanning→true → `apiService.runInvestigation(input)` → set result → isScanning→false
- [ ] `handleReset()`: clear result, set activeTab back to 'overview'
- [ ] Render logic:
  - No result → `<TargetIntake benchmarks={benchmarks} onSubmit={handleInvestigate} />`
  - Scanning → `<ScanRadarModal isOpen={isScanning} />`
  - Has result → `<Navbar>` + `<TabNav>` + switch on activeTab:
    - `overview` → `<IdentityHero>` + `<ConflictBanner>` + `<SignalsMatrix>`
    - `graph` → `<GraphCanvas>` (from P1-4)
    - `timeline` → `<ActivityTimeline>` (from Person 2)
    - `footprint` → `<FootprintGrid>` + `<ProfileList>` (from Person 2)
    - `evidence` → `<EvidencePanel>` (from P1-5)
  - Overlays: `<RagChatDrawer>` (Person 3) + `<DossierModal>` (Person 3)

### Task P1-4: 🔴 Build the interactive knowledge graph canvas
**Files:** `frontend/src/components/graph/GraphCanvas.tsx` + `CustomNodes.tsx`
- [ ] Uses `@xyflow/react` (already installed in package.json)
- [ ] Accept props: `nodes: GraphNode[]`, `edges: GraphEdge[]`
- [ ] Map backend node types → custom React Flow nodes:
  - `target` → 72px glowing avatar node, cyan pulsing ring, name + confidence
  - `profile` → 40px avatar, platform color pill (GitHub=green, X=white, LinkedIn=blue, Scholar=purple)
  - `organization` → Building icon, institution name
  - `project` / `event` / `publication` → category icon, title, date badge
- [ ] Custom edges: animated dash pattern, width scales with `edge.confidence`
- [ ] On node click: show evidence snippet in a tooltip/panel
- [ ] React Flow controls: `<Controls />`, `<MiniMap />`, `<Background variant="dots" />`
- [ ] Dark cyber theme: `#070b14` background, `#172540` dots
- **This is the judge WOW-factor — make it look impressive**

### Task P1-5: 🔴 Build CESV evidence audit panel
**File:** `frontend/src/components/evidence/EvidencePanel.tsx`
- [ ] Accept props: `claims: ClaimEvidence[]`, `conflicts: ConflictAnomaly[]`
- [ ] Filter pills: `[All]` `[CONFIRMED]` `[LIKELY]` `[UNRESOLVED]` `[CONFLICT]`
- [ ] Stats bar at top: count of each status with color-coded badges
- [ ] Each claim card shows:
  - Status badge (green=CONFIRMED, cyan=LIKELY, amber=UNRESOLVED, red=CONFLICT)
  - `claim_text` as main content
  - Small SVG confidence ring with percentage
  - Source URLs as clickable chips with platform icons
  - Supporting signals as small pills
- [ ] Sort: CONFIRMED first → LIKELY → UNRESOLVED → CONFLICT last
- [ ] Include `<ConflictBanner>` at the bottom if conflicts exist

---

# 🧑💻 PERSON 2 — (OSINT Connectors & Activity UI) — ~25% of the work

You own: the chronological timeline view, the digital footprint asset grid, and the profile cards.
The backend connectors (GitHub, HN, Dev.to, DDG) are **already built** — your work is frontend only.

## Already Done (your files that are finished):
- [x] `backend/app/engines/discovery.py` — GitHub, HackerNews, Dev.to, DuckDuckGo API connectors
- [x] `backend/app/engines/footprint_aggregator.py` — categorize + chronological sort
- [x] `backend/app/core/security.py` — PrivacyGuard consent check

## Tasks To Build:

### Task P2-1: 🔴 Build chronological activity timeline
**File:** `frontend/src/components/timeline/ActivityTimeline.tsx`
- [ ] Accept props: `timeline: ActivityItem[]`
- [ ] Filter pills at top: `[All]` `[Repositories]` `[Hackathons]` `[Publications]` `[Career]` `[Education]`
- [ ] Vertical glowing line (left border, cyan gradient on dark)
- [ ] Each timeline item:
  - Left side: date badge (`item.date`)
  - Center: category icon mapped:
    - Repositories → `<Code2 />` (green)
    - Hackathons → `<Trophy />` (amber)
    - Publications → `<BookOpen />` (purple)
    - Conferences → `<Mic />` (cyan)
    - Career → `<Briefcase />` (blue)
    - Education → `<GraduationCap />` (emerald)
  - Right side: title, description, organization, source link chip
- [ ] Framer Motion entrance: `initial={{ opacity: 0, x: -20 }}` → `animate={{ opacity: 1, x: 0 }}` with `transition={{ delay: index * 0.08 }}`
- [ ] Clicking source chip opens `item.source_url` in new tab

### Task P2-2: 🔴 Build footprint category asset grid
**File:** `frontend/src/components/footprint/FootprintGrid.tsx`
- [ ] Accept props: `activities: ActivityItem[]`
- [ ] Group by `item.category` into sections (Repositories, Hackathons, Publications, etc.)
- [ ] Section headers with category icon + count badge
- [ ] **Repository cards**: name, star count from `metadata.stars`, language badge from `metadata.language`, description, "View Source" link
- [ ] **Hackathon cards**: event name, organization, date, trophy icon, description
- [ ] **Publication cards**: title, platform, date, description
- [ ] Use `cyber-card` class from index.css for card styling
- [ ] Framer Motion grid entrance animation

### Task P2-3: 🔴 Build platform profile cards
**File:** `frontend/src/components/footprint/ProfileList.tsx`
- [ ] Accept props: `profiles: PublicProfile[]`
- [ ] One card per profile showing:
  - Avatar thumbnail (48px rounded)
  - Platform name with color: GitHub=`#10B981`, X=`#94a3b8`, LinkedIn=`#3B82F6`, Scholar=`#A855F7`
  - Display name + `@username`
  - Bio snippet (truncated 2 lines)
  - Followers count badge
  - Evidence score progress bar (0-100%)
  - ✅ "Verified Link" badge if `verified_link: true`
  - "Inspect Source →" button opens `profile_url` in new tab
- [ ] Use `cyber-card-glow` class for verified profiles, `cyber-card` for unverified

### Task P2-4: 🟡 Verify all 4 benchmark scenarios exist in backend
**File:** `backend/app/data/benchmarks.py`
- [ ] Confirm these keys exist: `case_multi_alias`, `case_disambiguation`, `case_conflict_anomaly`, `case_insufficient`
- [ ] If any are missing, add them matching the schema from the existing ones

---

# 🧑💻 PERSON 3 — (Copilot, Dossier & Polish) — ~20% of the work

You own: the AI copilot chat drawer, the executive dossier export modal, and benchmark polish.
The backend RAG engine and copilot route are **already built** — your work is frontend only.

## Already Done (your files that are finished):
- [x] `backend/app/engines/rag_copilot.py` — keyword-routed answers with citations
- [x] `backend/app/api/routes_copilot.py` — POST /query endpoint
- [x] `backend/app/data/benchmarks.py` — base benchmark structure (verify completeness in P2-4)
- [x] `frontend/src/components/intake/TargetIntake.tsx` — target input form with benchmark picker
- [x] `frontend/src/components/intake/ScanRadarModal.tsx` — animated radar loading modal

## Tasks To Build:

### Task P3-1: 🔴 Build AI investigation copilot chat drawer
**File:** `frontend/src/components/copilot/RagChatDrawer.tsx`
- [ ] Accept props: `investigationId: string`, `isOpen: boolean`, `onClose: () => void`
- [ ] Fixed position slide-over from right: `w-96`, `z-50`, dark glass background
- [ ] Header: "🤖 AI Investigation Copilot" + X close button
- [ ] Quick prompt pill buttons:
  - `"Summarize all conflicts"`
  - `"List key projects"`
  - `"Verify education claims"`
  - `"Show hackathon wins"`
  - `"Map all aliases"`
- [ ] Message thread area (scrollable):
  - User messages: right-aligned, cyan-tinted bubble
  - AI responses: left-aligned, slate bubble with markdown-formatted text
  - Citation chips below each AI response: `[Platform: URL]` clickable
  - Confidence badge per response
- [ ] Input bar at bottom: text field + send icon button
- [ ] State: `messages: { role: 'user'|'assistant', text: string, citations?: {platform:string,url:string}[], confidence?: number }[]`
- [ ] On send: call `apiService.queryCopilot(investigationId, query)` → append AI response
- [ ] Framer Motion: `animate={{ x: isOpen ? 0 : 400 }}`

### Task P3-2: 🔴 Build executive intelligence dossier modal
**File:** `frontend/src/components/export/DossierModal.tsx`
- [ ] Accept props: `result: InvestigationResult`, `isOpen: boolean`, `onClose: () => void`
- [ ] Full-screen modal overlay with scrollable content
- [ ] Sections (in order):
  1. **HEADER**: NEURAX logo text, "CLASSIFIED // PUBLIC SOURCE INTELLIGENCE REPORT", investigation_id, timestamp
  2. **EXECUTIVE SUMMARY**: likely_identity, overall_confidence (large number), summary_verdict paragraph
  3. **CONFIDENCE MATRIX**: reuse `<SignalsMatrix breakdown={result.confidence_breakdown} />`
  4. **RESOLVED IDENTITIES**: table of profiles — platform, username, evidence_score, verified badge
  5. **ALIAS CORRELATION**: list of `result.aliases` with match reason
  6. **DIGITAL FOOTPRINT**: activities grouped by category, each with title/date/source
  7. **CONFLICT LOG**: reuse `<ConflictBanner conflicts={result.conflicts} />`
  8. **CESV CLAIMS**: table — claim_id | type | status | confidence | sources
  9. **APPENDIX: PROVENANCE**: all unique source URLs cited across profiles and activities
- [ ] Buttons (add class `no-print`):
  - "🖨️ Print / Save PDF" → `window.print()`
  - "✕ Close" → `onClose()`
- [ ] Print CSS already exists in `index.css` (`@media print` rules with `.no-print` and `.print-only`)

### Task P3-3: 🟡 Add missing benchmark scenarios if needed
**File:** `backend/app/data/benchmarks.py`
- [ ] `case_conflict_anomaly`: 2 profiles with different locations (Seattle vs Bengaluru), creates ConflictAnomaly, overall_confidence ~65
- [ ] `case_insufficient`: vague "John" query, 1 weak match, overall_confidence ~28, status UNRESOLVED

---

# 📋 Build Order (everyone follow this sequence)

| Step | Who | Task | Depends On |
|------|-----|------|------------|
| 1 | Person 1 | P1-1: Fix tailwind config | nothing |
| 2 | Person 1 | P1-2: Create `main.tsx` | nothing |
| 3 | Person 1 | P1-3: Build `App.tsx` shell | P1-1, P1-2 |
| 4 | Person 2 | P2-1: ActivityTimeline.tsx | nothing (can start now) |
| 5 | Person 2 | P2-2: FootprintGrid.tsx | nothing (can start now) |
| 6 | Person 2 | P2-3: ProfileList.tsx | nothing (can start now) |
| 7 | Person 3 | P3-1: RagChatDrawer.tsx | nothing (can start now) |
| 8 | Person 3 | P3-2: DossierModal.tsx | nothing (can start now) |
| 9 | Person 1 | P1-4: GraphCanvas + CustomNodes | after P1-3 |
| 10 | Person 1 | P1-5: EvidencePanel.tsx | after P1-3 |
| 11 | Person 2 | P2-4: Verify benchmarks | anytime |
| 12 | Person 3 | P3-3: Add missing benchmarks | anytime |
| 13 | Person 1 | Wire Person 2 & 3 components into App.tsx | after steps 4-8 |

> **Person 2 and Person 3 can start building their components RIGHT NOW in parallel.**  
> Person 1 builds `main.tsx` + `App.tsx` first, then the graph canvas.  
> Final step: Person 1 wires everyone's components into `App.tsx`.

---

# ⚡ Quick Start

```bash
# Terminal 1 — Backend
cd NEURAX/backend && ./run_backend.sh

# Terminal 2 — Frontend
cd NEURAX/frontend && npm run dev

# Docs
open http://localhost:8000/api/docs
```

# 📊 Progress

| Person | Tasks | Done |
|--------|-------|------|
| Person 1 (Shiva) | P1-1, P1-2, P1-3, P1-4, P1-5 (5 tasks) | ☐☐☐☐☐ |
| Person 2 | P2-1, P2-2, P2-3, P2-4 (4 tasks) | ☐☐☐☐ |
| Person 3 | P3-1, P3-2, P3-3 (3 tasks) | ☐☐☐ |
