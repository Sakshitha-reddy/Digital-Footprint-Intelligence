import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Network, Clock, Database, ShieldCheck, LayoutDashboard,
  AlertTriangle, User, FileText, Sparkles, ArrowRight, Command
} from 'lucide-react';
import { InvestigationResult } from '../../types/intelligence';
import { TabType } from './TabNav';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  result: InvestigationResult | null;
  onNavigate: (tab: TabType) => void;
  onHighlight: (id: string) => void;
  onOpenCopilot: () => void;
  onOpenDossier: () => void;
  onReset: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  detail?: string;
  icon: React.ReactNode;
  section: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  result,
  onNavigate,
  onHighlight,
  onOpenCopilot,
  onOpenDossier,
  onReset,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build command items dynamically based on investigation state
  const items: CommandItem[] = useMemo(() => {
    const commands: CommandItem[] = [];

    // Navigation commands (always available)
    commands.push(
      { id: 'nav-overview', label: 'Go to Intelligence Overview', icon: <LayoutDashboard className="w-4 h-4 text-blue-400" />, section: 'Navigation', action: () => { onNavigate('overview'); onClose(); } },
      { id: 'nav-candidates', label: 'Go to Candidate Workspace', icon: <User className="w-4 h-4 text-indigo-400" />, section: 'Navigation', action: () => { onNavigate('candidates'); onClose(); } },
      { id: 'nav-evidence', label: 'Go to CESV Evidence', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, section: 'Navigation', action: () => { onNavigate('evidence'); onClose(); } },
      { id: 'nav-graph', label: 'Go to Knowledge Topology Graph', icon: <Network className="w-4 h-4 text-cyan-400" />, section: 'Navigation', action: () => { onNavigate('graph'); onClose(); } },
      { id: 'nav-timeline', label: 'Go to Chronological Timeline', icon: <Clock className="w-4 h-4 text-amber-400" />, section: 'Navigation', action: () => { onNavigate('timeline'); onClose(); } },
      { id: 'nav-footprint', label: 'Go to Digital Footprint', icon: <Database className="w-4 h-4 text-teal-400" />, section: 'Navigation', action: () => { onNavigate('footprint'); onClose(); } },
      { id: 'nav-conflicts', label: 'Go to Conflict Center', icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, section: 'Navigation', action: () => { onNavigate('conflicts'); onClose(); } },
      { id: 'nav-gaps', label: 'Go to Investigation Gaps & Unknowns', icon: <Search className="w-4 h-4 text-purple-400" />, section: 'Navigation', action: () => { onNavigate('gaps'); onClose(); } },
    );

    // Actions
    commands.push(
      { id: 'act-copilot', label: 'Open AI Copilot', detail: 'Ask evidence-grounded questions', icon: <Sparkles className="w-4 h-4 text-blue-400" />, section: 'Actions', action: () => { onOpenCopilot(); onClose(); } },
      { id: 'act-dossier', label: 'Export Intelligence Dossier', detail: 'Print or save as PDF', icon: <FileText className="w-4 h-4 text-emerald-400" />, section: 'Actions', action: () => { onOpenDossier(); onClose(); } },
      { id: 'act-new', label: 'New Investigation', detail: 'Start fresh target reconnaissance', icon: <Search className="w-4 h-4 text-slate-400" />, section: 'Actions', action: () => { onReset(); onClose(); } },
    );

    // Entity items from investigation result
    if (result) {
      // Profiles
      result.profiles.forEach((p) => {
        commands.push({
          id: `profile-${p.platform}-${p.username}`,
          label: `@${p.username}`,
          detail: `${p.platform} · ${Math.round(p.evidence_score * 100)}% evidence`,
          icon: <User className="w-4 h-4 text-cyan-400" />,
          section: 'Profiles',
          action: () => { onHighlight(`profile-${p.platform}-${p.username}`); onNavigate('footprint'); onClose(); },
        });
      });

      // Conflicts
      result.conflicts.forEach((c) => {
        commands.push({
          id: `conflict-${c.id}`,
          label: `Conflict: ${c.field}`,
          detail: `${c.value_a} vs ${c.value_b}`,
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          section: 'Conflicts',
          action: () => { onHighlight(`conflict-${c.id}`); onNavigate('overview'); onClose(); },
        });
      });
    }

    return commands;
  }, [result, onNavigate, onHighlight, onOpenCopilot, onOpenDossier, onReset, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.detail?.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Group by section
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach((item) => {
      (groups[item.section] ||= []).push(item);
    });
    return groups;
  }, [filtered]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault();
        filtered[activeIndex].action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [filtered, activeIndex, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="command-bar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="command-bar"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                ref={inputRef}
                className="command-bar-input"
                placeholder="Search entities, navigate views, or run actions…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="command-bar-kbd">ESC</span>
              </div>
            </div>

            {/* Results */}
            <div className="command-bar-results">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-slate-500 font-mono">
                  No results for "{query}"
                </div>
              ) : (
                Object.entries(grouped).map(([section, sectionItems]) => (
                  <div key={section}>
                    <div className="command-bar-section">{section}</div>
                    {sectionItems.map((item) => {
                      const globalIdx = filtered.indexOf(item);
                      return (
                        <div
                          key={item.id}
                          className={`command-bar-item ${globalIdx === activeIndex ? 'active' : ''}`}
                          onClick={item.action}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                        >
                          <div className="command-bar-item-icon">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">{item.label}</div>
                            {item.detail && (
                              <div className="text-[11px] text-slate-500 truncate">{item.detail}</div>
                            )}
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer Hint */}
            <div className="px-4 py-2 border-t border-white/[0.04] flex items-center gap-4 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1"><Command className="w-3 h-3" />K to toggle</span>
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>ESC close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
