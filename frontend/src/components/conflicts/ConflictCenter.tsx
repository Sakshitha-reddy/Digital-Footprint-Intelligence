import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConflictAnomaly } from '../../types/intelligence';
import {
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Info,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { CrossLinkHighlight } from '../shared/CrossLinkHighlight';

interface ConflictCenterProps {
  conflicts: ConflictAnomaly[];
  highlightedId?: string | null;
  onHighlight?: (id: string) => void;
  onNavigateToEvidence?: () => void;
}

export const ConflictCenter: React.FC<ConflictCenterProps> = ({
  conflicts,
  highlightedId,
  onHighlight,
  onNavigateToEvidence,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'high' | 'warning'>('ALL');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const filtered = conflicts.filter((c) => {
    if (severityFilter !== 'ALL' && c.severity !== severityFilter) return false;
    return true;
  });

  const toggleResolved = (id: string) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="cyber-card p-6 rounded-2xl border border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-medium mb-2 font-mono">
              <Scale className="w-3.5 h-3.5" />
              <span>CONTRADICTION ANALYSIS & DISCREPANCY RECONCILIATION</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Conflict Center ({conflicts.length} Anomalies Flagged)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Objective reconciliation workspace for conflicting attributes across disparate public sources. Evaluates temporal divergence, locational mismatches, and organizational contradictions using neutral evidentiary standards.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/[0.06] text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Critical</span>
              <span className="text-sm font-bold font-mono text-rose-400">
                {conflicts.filter((c) => c.severity === 'high').length}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/[0.06] text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Review</span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {conflicts.filter((c) => c.severity !== 'high').length}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/[0.06] text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Reconciled</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{resolvedIds.size}</span>
            </div>
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-white/[0.06]">
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Severity:
          </span>
          {(['ALL', 'high', 'warning'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                severityFilter === sev
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-900/60 text-slate-400 border border-white/[0.04] hover:border-white/[0.1]'
              }`}
            >
              {sev === 'ALL' ? 'All Discrepancies' : sev.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State when no conflicts exist */}
      {conflicts.length === 0 ? (
        <div className="cyber-card p-12 rounded-2xl border border-white/[0.08] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">No Contradictions Identified</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            All public profiles, chronological milestones, and organizational claims corroborate consistently across independent endpoints without temporal or locational disagreement.
          </p>
          {onNavigateToEvidence && (
            <button
              onClick={onNavigateToEvidence}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              <span>Inspect CESV Evidence Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* Conflict Cards List */
        <div className="space-y-4">
          {filtered.map((conflict) => {
            const isHigh = conflict.severity === 'high';
            const isReconciled = resolvedIds.has(conflict.id);

            return (
              <CrossLinkHighlight
                key={conflict.id}
                id={`conflict-${conflict.id}`}
                activeHighlightId={highlightedId || null}
              >
                <div
                  className={`cyber-card p-6 rounded-2xl border transition-all ${
                    isReconciled
                      ? 'border-emerald-500/20 bg-slate-900/40 opacity-75'
                      : isHigh
                      ? 'border-rose-500/30 bg-[#120d18]/90'
                      : 'border-amber-500/25 bg-[#14121a]/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert
                        className={`w-5 h-5 flex-shrink-0 ${
                          isReconciled ? 'text-emerald-400' : isHigh ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      />
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight font-sans">
                          Evidence Disagreement in <span className="text-amber-300">{conflict.field}</span>
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500">ID: {conflict.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold ${
                          isHigh
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        Severity: {conflict.severity}
                      </span>
                      <button
                        onClick={() => toggleResolved(conflict.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                          isReconciled
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                      >
                        {isReconciled ? 'Reconciled ✓' : 'Mark Reviewed'}
                      </button>
                    </div>
                  </div>

                  {/* Side-by-side Evidence Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Source A Claim */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.05] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                          Endpoint Alpha: {conflict.source_a}
                        </span>
                        <span className="text-[10px] font-mono text-rose-400/80">Primary Record</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <p className="text-xs font-semibold text-rose-200 font-mono">{conflict.value_a}</p>
                      </div>
                    </div>

                    {/* Source B Claim */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.05] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                          Endpoint Beta: {conflict.source_b}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400/80">Secondary Record</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs font-semibold text-amber-200 font-mono">{conflict.value_b}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Analysis Explanation */}
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-300 leading-relaxed font-normal bg-slate-900/50 p-3 rounded-xl border border-white/[0.04]">
                      <strong>Technical Observation:</strong> {conflict.explanation}
                    </p>

                    <div className="p-3.5 rounded-xl bg-blue-500/[0.08] border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white font-semibold">Analyst Reconciliation Suggestion:</strong>
                        <p className="text-slate-300 mt-0.5">{conflict.reconciliation_suggestion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CrossLinkHighlight>
            );
          })}
        </div>
      )}
    </div>
  );
};
