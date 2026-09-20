import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Network, Clock, Database, ShieldCheck,
  AlertTriangle, CheckCircle2
} from 'lucide-react';

export type TabType = 'overview' | 'candidates' | 'evidence' | 'graph' | 'timeline' | 'footprint' | 'conflicts' | 'gaps';

interface TabNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  claimsCount: number;
  conflictsCount: number;
  profilesCount?: number;
  timelineCount?: number;
  gapsCount?: number;
}

interface TabDef {
  id: TabType;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  shortcut: string;
  getBadge?: () => React.ReactNode;
}

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onChangeTab,
  claimsCount,
  conflictsCount,
  profilesCount = 0,
  timelineCount = 0,
  gapsCount = 0,
}) => {
  const tabs: TabDef[] = [
    {
      id: 'overview',
      label: 'Intelligence Overview',
      shortLabel: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      shortcut: '1',
      getBadge: () =>
        conflictsCount > 0 ? (
          <span className="ml-1 w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
        ) : null,
    },
    {
      id: 'candidates',
      label: 'Candidates',
      shortLabel: 'Candidates',
      icon: <Database className="w-4 h-4" />,
      shortcut: '2',
      getBadge: () =>
        profilesCount > 0 ? (
          <span className="ml-1 text-[10px] font-mono text-slate-500">{profilesCount}</span>
        ) : null,
    },
    {
      id: 'evidence',
      label: 'CESV Evidence',
      shortLabel: 'Evidence',
      icon: <ShieldCheck className="w-4 h-4" />,
      shortcut: '3',
      getBadge: () =>
        conflictsCount > 0 ? (
          <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
            <AlertTriangle className="w-2.5 h-2.5" />
            {conflictsCount}
          </span>
        ) : (
          <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono border border-emerald-500/25">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {claimsCount}
          </span>
        ),
    },
    {
      id: 'graph',
      label: 'Relationship Graph',
      shortLabel: 'Graph',
      icon: <Network className="w-4 h-4" />,
      shortcut: '4',
    },
    {
      id: 'timeline',
      label: 'Chronological Milestones',
      shortLabel: 'Timeline',
      icon: <Clock className="w-4 h-4" />,
      shortcut: '5',
      getBadge: () =>
        timelineCount > 0 ? (
          <span className="ml-1 text-[10px] font-mono text-slate-500">{timelineCount}</span>
        ) : null,
    },
    {
      id: 'footprint',
      label: 'Digital Footprint',
      shortLabel: 'Footprint',
      icon: <Database className="w-4 h-4" />,
      shortcut: '6',
    },
    {
      id: 'conflicts',
      label: 'Conflict Center',
      shortLabel: 'Conflicts',
      icon: <AlertTriangle className="w-4 h-4" />,
      shortcut: '7',
      getBadge: () =>
        conflictsCount > 0 ? (
          <span className="ml-1.5 px-1.5 py-0 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
            {conflictsCount}
          </span>
        ) : null,
    },
    {
      id: 'gaps',
      label: 'Investigation Gaps',
      shortLabel: 'Gaps',
      icon: <AlertTriangle className="w-4 h-4" />,
      shortcut: '8',
      getBadge: () =>
        gapsCount > 0 ? (
          <span className="ml-1 text-[10px] font-mono text-slate-500">{gapsCount}</span>
        ) : null,
    },
  ];

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < tabs.length) {
        onChangeTab(tabs[idx].id);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onChangeTab]);

  return (
    <div className="w-full border-b border-white/[0.06] bg-[#0b101b]/80 backdrop-blur-md no-print">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        <nav className="flex items-center gap-0.5 overflow-x-auto py-1.5 no-scrollbar" aria-label="Investigation Stages">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap focus-ring ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {tab.getBadge?.()}

                {/* Keyboard hint */}
                <span className="hidden lg:inline text-[9px] font-mono text-slate-600 ml-0.5">{tab.shortcut}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 rounded-lg bg-blue-600/12 border border-blue-500/25 -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
