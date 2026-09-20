import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SourceStatus } from '../../types/intelligence';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Database,
} from 'lucide-react';

interface SourceStatusBarProps {
  statuses?: SourceStatus[];
  isDemo?: boolean;
}

export const SourceStatusBar: React.FC<SourceStatusBarProps> = ({
  statuses = [],
  isDemo = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!statuses || statuses.length === 0) {
    return null;
  }

  const completeCount = statuses.filter((s) => s.status === 'complete').length;
  const unavailableCount = statuses.filter((s) => s.status === 'unavailable').length;
  const failedCount = statuses.filter((s) => s.status === 'failed').length;

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[#080d19] overflow-hidden shadow-lg">
      {/* Header Bar */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/[0.06] bg-[#060a13]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white font-sans tracking-tight">
              OSINT Connectors & Source Provenance Matrix
            </span>
          </div>

          {/* Real OSINT vs Demo Benchmark Badge */}
          {isDemo ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-semibold">
              DEMO BENCHMARK DATA
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE OSINT VERIFIED</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-emerald-400 font-semibold">{completeCount} verified</span>
            <span>·</span>
            <span className="text-amber-400 font-semibold">{unavailableCount} unavailable</span>
            {failedCount > 0 && (
              <>
                <span>·</span>
                <span className="text-rose-400 font-semibold">{failedCount} failed</span>
              </>
            )}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
          >
            <span>{expanded ? 'Collapse' : 'Inspect'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Grid of Source Status Badges Grouped by Agent */}
      <div className="p-4 space-y-4">
        {[
          { title: '🐙 GitHub Agent', platforms: ['GitHub'] },
          { title: '💻 Coding Agent', platforms: ['LeetCode', 'CodeChef', 'Codeforces'] },
          { title: '🌐 Social Agent', platforms: ['LinkedIn', 'Twitter / X', 'Instagram'] },
          { title: '🔍 Auxiliary OSINT Knowledge', platforms: ['Web Search', 'Dev.to', 'HackerNews', 'YouTube', 'AI Web Scraper', 'Wikimedia', 'OpenAlex'] },
        ].map((group) => {
          const groupStatuses = statuses.filter((s) => group.platforms.includes(s.platform));
          if (groupStatuses.length === 0) return null;

          return (
            <div key={group.title} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </span>
                <span className="h-px flex-1 bg-white/[0.05]" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {groupStatuses.map((src) => {
                  const isComplete = src.status === 'complete';
                  const isUnavailable = src.status === 'unavailable';
                  const isFailed = src.status === 'failed';
                  const isEmpty = src.status === 'empty';

                  return (
                    <div
                      key={src.platform}
                      className={`p-3 rounded-xl border transition-all ${
                        isComplete
                          ? 'bg-emerald-500/[0.04] border-emerald-500/25'
                          : isUnavailable
                          ? 'bg-amber-500/[0.04] border-amber-500/25'
                          : isFailed
                          ? 'bg-rose-500/[0.04] border-rose-500/25'
                          : 'bg-slate-900/40 border-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-sans">{src.platform}</span>
                        {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                        {isUnavailable && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                        {isFailed && <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />}
                        {isEmpty && <span className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />}
                      </div>

                      <div className="mt-1.5 flex items-baseline justify-between text-[11px] font-mono">
                        <span
                          className={
                            isComplete
                              ? 'text-emerald-400 font-semibold'
                              : isUnavailable
                              ? 'text-amber-400 font-semibold'
                              : isFailed
                              ? 'text-rose-400 font-semibold'
                              : 'text-slate-500'
                          }
                        >
                          {isComplete ? 'Complete' : isUnavailable ? 'Unavailable' : isFailed ? 'Failed' : 'Empty'}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {src.records_found} {src.records_found === 1 ? 'rec' : 'recs'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Detailed Audit Log */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.06] bg-slate-950/60 p-4 space-y-2.5 text-xs font-mono"
          >
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
              Connector Audit Provenance Logs
            </div>
            {statuses.map((src) => (
              <div
                key={src.platform}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-white w-24 flex-shrink-0">{src.platform}</span>
                  <span className="text-slate-300 truncate">
                    {src.details || (src.error ? `Error: ${src.error}` : 'No details recorded.')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-[10px] flex-shrink-0">
                  <span>Timestamp: {src.retrieved_at ? src.retrieved_at.substring(11, 19) + ' UTC' : 'N/A'}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
