import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ConfidenceGauge } from '../shared/ConfidenceGauge';

interface SignalsMatrixProps {
  breakdown: Record<string, number>;
  onNavigateEvidence?: () => void;
}

export const SignalsMatrix: React.FC<SignalsMatrixProps> = ({ breakdown, onNavigateEvidence }) => {
  const entries = Object.entries(breakdown);
  // Find strongest and weakest signals for visual hierarchy
  const maxScore = Math.max(...entries.map(([, v]) => v));
  const minScore = Math.min(...entries.map(([, v]) => v));

  return (
    <div className="cyber-card p-6 rounded-2xl border border-white/[0.08]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight font-sans flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Multi-Factor Evidence Signal Matrix
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
            Cross-corroborated evidence vectors · Bayesian attribution v3.0
          </p>
        </div>
        {onNavigateEvidence && (
          <button
            onClick={onNavigateEvidence}
            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors self-start sm:self-auto"
          >
            Full Evidence Audit <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {entries.map(([signalName, score], idx) => {
          const isHigh = score >= 80;
          const isMed = score >= 50 && score < 80;
          const isMax = score === maxScore;
          const isMin = score === minScore && entries.length > 1;

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all group cursor-default ${
                isMax
                  ? 'bg-slate-900/80 border-emerald-500/20 hover:border-emerald-500/40'
                  : isMin
                  ? 'bg-slate-900/40 border-white/[0.04] hover:border-amber-500/30 opacity-80 hover:opacity-100'
                  : 'bg-slate-900/60 border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              {/* Header: Status badge + Gauge */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isHigh
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : isMed
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {isHigh ? 'Strong' : isMed ? 'Partial' : 'Weak'}
                </span>
                <ConfidenceGauge value={score} size="xs" showLabel={false} />
              </div>

              {/* Signal Name */}
              <h4 className="text-[11px] font-semibold text-slate-200 line-clamp-2 min-h-[28px] leading-snug mb-2">
                {signalName}
              </h4>

              {/* Score bar + value */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isHigh
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : isMed
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, score))}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-bold font-mono ${
                    isHigh ? 'text-emerald-400' : isMed ? 'text-blue-400' : 'text-amber-400'
                  }`}
                >
                  {score}%
                </span>
              </div>

              {/* Visual hierarchy indicator */}
              {isMax && (
                <div className="mt-2 text-[9px] font-mono text-emerald-500/70 uppercase tracking-wider">
                  ▲ Strongest Signal
                </div>
              )}
              {isMin && entries.length > 2 && (
                <div className="mt-2 text-[9px] font-mono text-amber-500/60 uppercase tracking-wider">
                  ▼ Investigate
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
