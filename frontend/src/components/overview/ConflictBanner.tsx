import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConflictAnomaly } from '../../types/intelligence';
import { AlertTriangle, ChevronDown, ArrowRight, ShieldAlert } from 'lucide-react';
import { CrossLinkHighlight } from '../shared/CrossLinkHighlight';

interface ConflictBannerProps {
  conflicts: ConflictAnomaly[];
  onHighlight?: (id: string) => void;
  highlightedId?: string | null;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({
  conflicts,
  onHighlight,
  highlightedId,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!conflicts || conflicts.length === 0) return null;

  // Sort: high severity first
  const sorted = [...conflicts].sort((a, b) => {
    const order: Record<string, number> = { high: 0, warning: 1 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-amber-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-amber-500/[0.04] border-b border-amber-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>Data Inconsistency Alerts</span>
          <span className="text-xs font-mono text-amber-500/70 ml-1">({conflicts.length})</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 self-start sm:self-auto">
          REQUIRES RECONCILIATION
        </span>
      </div>

      {/* Conflict Cards */}
      <div className="divide-y divide-white/[0.04]">
        {sorted.map((c) => {
          const isExpanded = expandedIds.has(c.id);
          const isCritical = c.severity === 'high';

          return (
            <CrossLinkHighlight key={c.id} id={`conflict-${c.id}`} activeHighlightId={highlightedId || null}>
              <div className={`${isCritical ? 'priority-critical' : 'priority-warning'}`}>
                {/* Collapsed Summary — Always visible */}
                <button
                  onClick={() => toggleExpand(c.id)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left expand-trigger"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${isCritical ? 'text-rose-400' : 'text-amber-400'}`} />
                    <div className="min-w-0">
                      <span className="text-sm text-white font-medium">
                        Discrepancy in <span className={isCritical ? 'text-rose-300' : 'text-amber-300'}>{c.field}</span>
                      </span>
                      <span className="text-xs text-slate-500 ml-2 font-mono">
                        {c.value_a} ↔ {c.value_b}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isCritical ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {c.severity.toUpperCase()}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 expand-icon ${isExpanded ? 'expand-icon-open' : ''}`} />
                  </div>
                </button>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-3">
                        {/* Side-by-side comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                          <div>
                            <span className="text-[10px] font-medium text-slate-500 block mb-1 font-mono">{c.source_a}</span>
                            <span className="text-white font-medium text-xs px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 inline-block">
                              {c.value_a}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-slate-500 block mb-1 font-mono">{c.source_b}</span>
                            <span className="text-white font-medium text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 inline-block">
                              {c.value_b}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-400 leading-relaxed text-xs">{c.explanation}</p>

                        <div className="p-3 rounded-lg bg-blue-500/[0.06] border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-blue-200 font-semibold">Reconciliation:</strong>{' '}
                            <span>{c.reconciliation_suggestion}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CrossLinkHighlight>
          );
        })}
      </div>
    </div>
  );
};
