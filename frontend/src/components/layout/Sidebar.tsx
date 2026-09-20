import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Network,
  Clock,
  Database,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Command,
} from 'lucide-react';
import { TabType } from './TabNav';

interface SidebarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  claimsCount: number;
  conflictsCount: number;
  profilesCount: number;
  timelineCount: number;
  gapsCount: number;
  onOpenCopilot: () => void;
  onOpenDossier: () => void;
  onOpenCommandPalette: () => void;
}

interface NavItemDef {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  badge?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  collapsed,
  onToggleCollapse,
  claimsCount,
  conflictsCount,
  profilesCount,
  timelineCount,
  gapsCount,
  onOpenCopilot,
  onOpenDossier,
  onOpenCommandPalette,
}) => {
  const navItems: NavItemDef[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" />,
      shortcut: '1',
      badge: conflictsCount > 0 ? (
        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
      ) : null,
    },
    {
      id: 'candidates',
      label: 'Candidate Workspace',
      icon: <Users className="w-5 h-5 flex-shrink-0" />,
      shortcut: '2',
      badge: profilesCount > 0 ? (
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          {profilesCount}
        </span>
      ) : null,
    },
    {
      id: 'evidence',
      label: 'Evidence Intelligence',
      icon: <ShieldCheck className="w-5 h-5 flex-shrink-0" />,
      shortcut: '3',
      badge: (
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {claimsCount}
        </span>
      ),
    },
    {
      id: 'graph',
      label: 'Relationship Graph',
      icon: <Network className="w-5 h-5 flex-shrink-0" />,
      shortcut: '4',
    },
    {
      id: 'timeline',
      label: 'Intelligence Timeline',
      icon: <Clock className="w-5 h-5 flex-shrink-0" />,
      shortcut: '5',
      badge: timelineCount > 0 ? (
        <span className="text-[11px] font-mono text-slate-500">{timelineCount}</span>
      ) : null,
    },
    {
      id: 'footprint',
      label: 'Digital Footprint',
      icon: <Database className="w-5 h-5 flex-shrink-0" />,
      shortcut: '6',
    },
    {
      id: 'conflicts',
      label: 'Conflict Center',
      icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
      shortcut: '7',
      badge: conflictsCount > 0 ? (
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
          {conflictsCount}
        </span>
      ) : (
        <span className="text-[11px] font-mono text-slate-600">0</span>
      ),
    },
    {
      id: 'gaps',
      label: 'Investigation Gaps',
      icon: <HelpCircle className="w-5 h-5 flex-shrink-0" />,
      shortcut: '8',
      badge: gapsCount > 0 ? (
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
          {gapsCount}
        </span>
      ) : null,
    },
  ];

  return (
    <aside
      className={`relative z-30 border-r border-slate-400/12 bg-[#081224]/45 backdrop-blur-2xl flex flex-col justify-between transition-all duration-300 select-none no-print shadow-2xl ${
        collapsed ? 'w-[64px]' : 'w-[260px]'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar py-3">
        {/* Navigation Group Header */}
        <div className="px-3 pb-2 mb-1 flex items-center justify-between">
          {!collapsed && (
            <span className="text-[12px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Workspace
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors ml-auto"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary Navigation Items */}
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                {/* Shared Active Background Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 rounded-xl bg-blue-600/15 border border-blue-500/30 -z-0"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}

                {/* Active left accent indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-blue-400 z-10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}

                <div className={`${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {item.icon}
                </div>

                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.badge}
                      <span className="text-[11px] font-mono text-slate-600 group-hover:text-slate-500">
                        {item.shortcut}
                      </span>
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tools Divider */}
        <div className="my-4 px-3">
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* Secondary Analyst Tools */}
        <div className="px-2 space-y-1">
          {!collapsed && (
            <div className="px-2 pb-1.5">
              <span className="text-[12px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Intelligence Tools
              </span>
            </div>
          )}

          {/* AI Copilot Trigger */}
          <button
            onClick={onOpenCopilot}
            title={collapsed ? 'AI Copilot' : undefined}
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-blue-600/10 border border-transparent hover:border-blue-500/20 transition-all"
          >
            <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && (
              <>
                <span className="truncate flex-1 text-left">AI Copilot</span>
                <span className="text-[11px] font-mono text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                  RAG
                </span>
              </>
            )}
          </button>

          {/* Dossier Trigger */}
          <button
            onClick={onOpenDossier}
            title={collapsed ? 'Executive Dossier' : undefined}
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-all"
          >
            <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 group-hover:text-slate-200" />
            {!collapsed && (
              <>
                <span className="truncate flex-1 text-left">Executive Dossier</span>
                <span className="text-[11px] font-mono text-slate-500">PDF</span>
              </>
            )}
          </button>

          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            title={collapsed ? 'Command Palette (⌘K)' : undefined}
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all"
          >
            <Command className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-slate-300" />
            {!collapsed && (
              <>
                <span className="truncate flex-1 text-left">Commands</span>
                <kbd className="command-bar-kbd text-[11px]">⌘K</kbd>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Telemetry & Status Indicator */}
      <div className="p-3 border-t border-white/[0.06] bg-[#070b13]">
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-mono font-medium text-slate-300 truncate">
                ENGINE: <strong className="text-emerald-400">ACTIVE</strong>
              </p>
              <p className="text-[11px] font-mono text-slate-500 truncate">
                CONSENT: ENFORCED
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
