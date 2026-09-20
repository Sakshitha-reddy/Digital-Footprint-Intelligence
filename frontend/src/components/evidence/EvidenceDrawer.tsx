import React, { useState, useMemo } from 'react';
import { InvestigationResult, ClaimEvidence } from '../../types/intelligence';
import { SourceCard } from './SourceCard';
import { ShieldCheck, Search, Filter, ArrowUpDown } from 'lucide-react';

interface EvidenceDrawerProps {
  result: InvestigationResult;
  highlightedId?: string | null;
}

type StatusFilter = 'ALL' | 'CONFIRMED' | 'LIKELY' | 'UNRESOLVED' | 'CONFLICT';
type SortMode = 'status' | 'confidence' | 'date';

const STATUS_ORDER: Record<string, number> = {
  CONFIRMED: 0,
  LIKELY: 1,
  UNRESOLVED: 2,
  CONFLICT: 3,
};

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ result, highlightedId }) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('status');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { CONFIRMED: 0, LIKELY: 0, UNRESOLVED: 0, CONFLICT: 0 };
    result.claims.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [result.claims]);

  // Filter and sort
  const filtered = useMemo(() => {
    let list = result.claims;

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((c) => c.status === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.claim_text.toLowerCase().includes(q) ||
          c.claim_type.toLowerCase().includes(q) ||
          c.claim_id.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortMode === 'confidence') return b.confidence - a.confidence;
      if (sortMode === 'date') return new Date(b.retrieval_timestamp).getTime() - new Date(a.retrieval_timestamp).getTime();
      // Default: status order
      return (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4);
    });
  }, [result.claims, statusFilter, sortMode, searchQuery]);

  const filterButtons: { value: StatusFilter; label: string; color: string }[] = [
    { value: 'ALL', label: `All (${result.claims.length})`, color: 'text-slate-300 bg-slate-800 border-slate-700' },
    { value: 'CONFIRMED', label: `Confirmed (${statusCounts.CONFIRMED})`, color: 'text-emerald-400 bg-emerald-950/50 border-emerald-800' },
    { value: 'LIKELY', label: `Likely (${statusCounts.LIKELY})`, color: 'text-cyan-400 bg-cyan-950/50 border-cyan-800' },
    { value: 'UNRESOLVED', label: `Unresolved (${statusCounts.UNRESOLVED})`, color: 'text-amber-400 bg-amber-950/50 border-amber-800' },
    { value: 'CONFLICT', label: `Conflict (${statusCounts.CONFLICT})`, color: 'text-rose-400 bg-rose-950/50 border-rose-800' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="cyber-card p-5 rounded-2xl border border-white/[0.07]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            CESV Evidence Ledger
          </h3>
          <p className="text-[11px] text-slate-500 font-mono">
            Every finding has a Claim, Evidence, Source URL, and Verification status
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            ['Claims', result.claims.length, 'text-white'],
            ['Verified', statusCounts.CONFIRMED, 'text-emerald-400'],
            ['Conflicts', result.conflicts.length, result.conflicts.length > 0 ? 'text-amber-400' : 'text-slate-300'],
            ['Confidence', `${result.overall_confidence}%`, result.overall_confidence >= 80 ? 'text-emerald-400' : 'text-amber-400'],
          ].map(([k, v, color]) => (
            <div key={String(k)} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <p className="text-[10px] font-mono text-slate-500 uppercase">{k}</p>
              <p className={`text-lg font-bold font-mono ${color}`}>{v}</p>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claims, types, or IDs…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono outline-none focus:border-cyan-500 placeholder-slate-600"
          />
        </div>

        {/* Filter pills + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          {filterButtons.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-2 py-1 rounded-md text-[10px] font-mono border transition-all ${
                statusFilter === f.value
                  ? f.color
                  : 'text-slate-500 bg-slate-900 border-slate-800 hover:border-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="ml-auto">
            <button
              onClick={() => {
                const modes: SortMode[] = ['status', 'confidence', 'date'];
                const idx = modes.indexOf(sortMode);
                setSortMode(modes[(idx + 1) % modes.length]);
              }}
              className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortMode === 'status' ? 'By Status' : sortMode === 'confidence' ? 'By Confidence' : 'By Date'}
            </button>
          </div>
        </div>
      </div>

      {/* Claims List */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-xs font-mono text-slate-500">
          No claims match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <SourceCard key={c.claim_id} claim={c} highlightedId={highlightedId} />
          ))}
        </div>
      )}
    </div>
  );
};
