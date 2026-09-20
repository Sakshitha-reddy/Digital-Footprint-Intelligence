import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GlobalBackground } from './components/layout/GlobalBackground';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { TabNav, TabType } from './components/layout/TabNav';
import { CommandPalette } from './components/layout/CommandPalette';
import { InvestigationStatusBar } from './components/layout/InvestigationStatusBar';
import { TargetIntake } from './components/intake/TargetIntake';
import { ScanRadarModal } from './components/intake/ScanRadarModal';
import { IdentityHero } from './components/overview/IdentityHero';
import { SignalsMatrix } from './components/overview/SignalsMatrix';
import { ConflictBanner } from './components/overview/ConflictBanner';
import { CandidateWorkspace } from './components/candidates/CandidateWorkspace';
import { ConflictCenter } from './components/conflicts/ConflictCenter';
import { InvestigationGaps } from './components/gaps/InvestigationGaps';
import { GraphCanvas } from './components/graph/GraphCanvas';
import { ActivityTimeline } from './components/timeline/ActivityTimeline';
import { FootprintGrid } from './components/footprint/FootprintGrid';
import { EvidenceDrawer } from './components/evidence/EvidenceDrawer';
import { RagChatDrawer } from './components/copilot/RagChatDrawer';
import { DossierModal } from './components/export/DossierModal';
import { SourceStatusBar } from './components/overview/SourceStatusBar';
import { ExposureIntelligenceCard } from './components/overview/ExposureIntelligenceCard';
import { AuthModal, UserSession } from './components/auth/AuthModal';
import { apiService } from './services/api';
import { authApi } from './services/authApi';
import { BenchmarkItem, InvestigationResult, TargetInput, PublicProfile } from './types/intelligence';

const App: React.FC = () => {
  // Core state
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('aporia_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Overlay state
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Cross-view context state — enables linking between views
  const [highlightedEntityId, setHighlightedEntityId] = useState<string | null>(null);

  // Clear highlight after animation completes
  useEffect(() => {
    if (highlightedEntityId) {
      const timer = setTimeout(() => setHighlightedEntityId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedEntityId]);

  // Fetch benchmarks and validate session on mount
  useEffect(() => {
    apiService.fetchBenchmarks().then(setBenchmarks).catch(() => setBenchmarks([]));
    authApi.getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K → Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Quick workspace switching via 1-8 if not typing
      if (result && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        const tabShortcuts: Record<string, TabType> = {
          '1': 'overview',
          '2': 'candidates',
          '3': 'evidence',
          '4': 'graph',
          '5': 'timeline',
          '6': 'footprint',
          '7': 'conflicts',
          '8': 'gaps',
        };
        if (tabShortcuts[e.key]) {
          setActiveTab(tabShortcuts[e.key]);
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [result]);

  const handleSubmit = async (input: TargetInput) => {
    setError(null);
    setScanning(true);
    const started = Date.now();
    try {
      const data = await apiService.runInvestigation(input);
      const elapsed = Date.now() - started;
      if (elapsed < 2400) {
        await new Promise((r) => setTimeout(r, 2400 - elapsed));
      }
      setResult(data);
      if (data.resolution_status === 'ambiguous') {
        setActiveTab('candidates');
      } else {
        setActiveTab('overview');
      }
    } catch (e: any) {
      setError(e?.message || 'Investigation failed. Ensure backend service is reachable on :8000.');
    } finally {
      setScanning(false);
    }
  };

  const handleSelectCandidate = useCallback((profile: PublicProfile) => {
    if (!result) return;
    const updated = { ...result };
    if (result.candidates && result.candidates.length > 0) {
      const matched = result.candidates.find(
        (c) => c.username === profile.username || c.name === profile.display_name || c.profile_url === profile.profile_url
      );
      if (matched) {
        updated.likely_identity = matched.name;
        updated.overall_confidence = matched.confidence;
        updated.primary_candidate = matched;
        updated.resolution_status = 'unique';
        if (matched.profiles && matched.profiles.length > 0) {
          updated.profiles = matched.profiles;
        }
      } else {
        updated.likely_identity = profile.display_name || profile.username;
        updated.resolution_status = 'unique';
      }
    } else {
      updated.likely_identity = profile.display_name || profile.username;
      updated.resolution_status = 'unique';
    }
    setResult(updated);
    setActiveTab('overview');
  }, [result]);

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCopilotOpen(false);
    setDossierOpen(false);
    setCommandPaletteOpen(false);
    setHighlightedEntityId(null);
    setActiveTab('overview');
  };

  const handleHighlight = useCallback((id: string) => {
    setHighlightedEntityId(id);
  }, []);

  const handleNavigateToTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white font-sans bg-[#030712]">
      {/* 1. Persistent Global Earth Network Background */}
      <GlobalBackground showNodes={!result} />

      {/* 2. Persistent Enterprise Navigation Bar */}
      <Navbar
        hasResult={!!result}
        investigationId={result?.investigation_id}
        confidence={result?.overall_confidence}
        currentUser={currentUser}
        onOpenDossier={() => setDossierOpen(true)}
        onOpenCopilot={() => setCopilotOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onReset={handleReset}
        onOpenAuth={(mode) => {
          setCopilotOpen(false);
          setDossierOpen(false);
          setAuthMode(mode || 'signin');
          setAuthModalOpen(true);
        }}
        onSignOut={async () => {
          await authApi.logout();
          setCurrentUser(null);
        }}
      />

      {/* Authentication Modal (Sign In / Create Account) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* 9-Stage Telemetry Radar Modal */}
      <ScanRadarModal isOpen={scanning} />

      {/* Enterprise Command Palette (⌘K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        result={result}
        onNavigate={handleNavigateToTab}
        onHighlight={handleHighlight}
        onOpenCopilot={() => setCopilotOpen(true)}
        onOpenDossier={() => setDossierOpen(true)}
        onReset={handleReset}
      />

      {!result ? (
        <div className="flex-1 flex flex-col">
          {error && (
            <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-28 pt-4">
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-700/60 text-rose-300 text-xs font-mono flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-rose-400 hover:text-white text-xs underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <TargetIntake 
            benchmarks={benchmarks} 
            onSubmit={handleSubmit} 
            isLoading={scanning} 
            currentUser={currentUser}
            onOpenAuth={(mode) => {
              setAuthMode(mode || 'signin');
              setAuthModalOpen(true);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex min-h-[calc(100vh-64px)] relative">
          {/* Collapsible Enterprise Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            claimsCount={result.claims.length}
            conflictsCount={result.conflicts.length}
            profilesCount={result.profiles.length}
            timelineCount={result.timeline.length}
            gapsCount={2}
            onOpenCopilot={() => setCopilotOpen(true)}
            onOpenDossier={() => setDossierOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          />

          {/* Main Investigation Workspace */}
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
            {/* Top Workspace Tab Nav */}
            <TabNav
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              claimsCount={result.claims.length}
              conflictsCount={result.conflicts.length}
              profilesCount={result.profiles.length}
              timelineCount={result.timeline.length}
              gapsCount={2}
            />

            {/* Workspace View Area */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 pb-20 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <>
                      <SourceStatusBar
                        statuses={result.source_statuses}
                        isDemo={result.is_demo}
                      />
                      <IdentityHero
                        result={result}
                        onOpenEvidence={() => setActiveTab('evidence')}
                        onHighlight={handleHighlight}
                        highlightedId={highlightedEntityId}
                      />
                      <ConflictBanner
                        conflicts={result.conflicts}
                        onHighlight={handleHighlight}
                        highlightedId={highlightedEntityId}
                      />
                      <ExposureIntelligenceCard exposure={result.exposure_intelligence} />
                      <SignalsMatrix
                        breakdown={result.confidence_breakdown}
                        onNavigateEvidence={() => setActiveTab('evidence')}
                      />
                    </>
                  )}

                  {/* TAB 2: CANDIDATE WORKSPACE */}
                  {activeTab === 'candidates' && (
                    <CandidateWorkspace
                      result={result}
                      highlightedId={highlightedEntityId}
                      onHighlight={handleHighlight}
                      onNavigateToGraph={() => setActiveTab('graph')}
                      onNavigateToEvidence={() => setActiveTab('evidence')}
                      onSelectCandidate={handleSelectCandidate}
                    />
                  )}

                  {/* TAB 3: EVIDENCE INTELLIGENCE */}
                  {activeTab === 'evidence' && (
                    <EvidenceDrawer
                      result={result}
                      highlightedId={highlightedEntityId}
                    />
                  )}

                  {/* TAB 4: RELATIONSHIP GRAPH */}
                  {activeTab === 'graph' && (
                    <GraphCanvas
                      key={result.investigation_id}
                      nodes={result.graph_nodes}
                      edges={result.graph_edges}
                      highlightedId={highlightedEntityId}
                      onHighlight={handleHighlight}
                    />
                  )}

                  {/* TAB 5: INTELLIGENCE TIMELINE */}
                  {activeTab === 'timeline' && (
                    <ActivityTimeline
                      timeline={result.timeline}
                      highlightedId={highlightedEntityId}
                      onHighlight={handleHighlight}
                    />
                  )}

                  {/* TAB 6: DIGITAL FOOTPRINT */}
                  {activeTab === 'footprint' && (
                    <FootprintGrid
                      activities={result.activities}
                      profiles={result.profiles}
                      highlightedId={highlightedEntityId}
                      onHighlight={handleHighlight}
                    />
                  )}

                  {/* TAB 7: CONFLICT RECONCILIATION CENTER */}
                  {activeTab === 'conflicts' && (
                    <ConflictCenter
                      conflicts={result.conflicts}
                      highlightedId={highlightedEntityId}
                      onHighlight={handleHighlight}
                      onNavigateToEvidence={() => setActiveTab('evidence')}
                    />
                  )}

                  {/* TAB 8: INVESTIGATION GAPS & UNKNOWNS */}
                  {activeTab === 'gaps' && (
                    <InvestigationGaps
                      result={result}
                      onNavigateToCopilot={() => setCopilotOpen(true)}
                      onNavigateToTimeline={() => setActiveTab('timeline')}
                      onNavigateToCandidates={() => setActiveTab('candidates')}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* AI Copilot Drawer */}
          <RagChatDrawer
            isOpen={copilotOpen}
            onClose={() => setCopilotOpen(false)}
            investigationId={result.investigation_id}
          />

          {/* Intelligence Dossier Export Modal */}
          <DossierModal
            isOpen={dossierOpen}
            onClose={() => setDossierOpen(false)}
            result={result}
          />

          {/* Persistent Live Investigation Status Bar */}
          <InvestigationStatusBar result={result} />
        </div>
      )}
    </div>
  );
};

export default App;
