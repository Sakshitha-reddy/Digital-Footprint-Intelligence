import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClaimEvidence } from '../../types/intelligence';
import { CheckCircle2, AlertTriangle, HelpCircle, Ban, ExternalLink, ChevronDown, Copy, CheckCheck } from 'lucide-react';
import { ConfidenceGauge } from '../shared/ConfidenceGauge';
import { CrossLinkHighlight } from '../shared/CrossLinkHighlight';

interface SourceCardProps {
  claim: ClaimEvidence;
  highlightedId?: string | null;
}

const STATUS_STYLE: Record<string, { cls: string; icon: React.ReactNode; border: string }> = {
  CONFIRMED: {
    cls: 'text-emerald-400 bg-emerald-950/50 border-emerald-800',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    border: 'border-l-emerald-500',
  },
  LIKELY: {
    cls: 'text-cyan-400 bg-cyan-950/50 border-cyan-800',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    border: 'border-l-cyan-500',
  },
  UNRESOLVED: {
    cls: 'text-amber-400 bg-amber-950/50 border-amber-800',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    border: 'border-l-amber-500',
  },
  CONFLICT: {
    cls: 'text-rose-400 bg-rose-950/50 border-rose-800',
    icon: <Ban className="w-3.5 h-3.5" />,
    border: 'border-l-rose-500',
  },
};

export const SourceCard: React.FC<SourceCardProps> = ({ claim, highlightedId }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const st = STATUS_STYLE[claim.status] || STATUS_STYLE.LIKELY;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(claim.claim_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Priority visual weight
  const priorityClass =
    claim.status === 'CONFLICT' ? 'priority-critical' :
    claim.status === 'UNRESOLVED' ? 'priority-warning' :
    claim.status === 'CONFIRMED' ? 'priority-success' : '';

  return (
    <CrossLinkHighlight id={`claim-${claim.claim_id}`} activeHighlightId={highlightedId || null}>
      <div className={`rounded-xl bg-slate-950/70 border border-slate-800 overflow-hidden border-l-[3px] ${st.border} ${
        claim.status === 'CONFLICT' ? 'animate-provenance-pulse' : ''
      }`}>
        {/* Summary (always visible) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 text-left expand-trigger"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-slate-600">
                  {claim.claim_id}
                </span>
                <span className="text-[10px] font-mono text-slate-500">·</span>
                <span className="text-[10px] font-mono text-slate-500">{claim.claim_type}</span>
              </div>
              <p className="text-sm text-white leading-relaxed">{claim.claim_text}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${st.cls}`}>
                {st.icon}
                {claim.status}
              </span>
              <ConfidenceGauge value={claim.confidence} size="xs" />
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 expand-icon ${expanded ? 'expand-icon-open' : ''}`} />
            </div>
          </div>
        </button>

        {/* Expanded Evidence Trail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
                {/* Confidence Bar */}
                <div className="flex items-center gap-3">
                  <ConfidenceGauge value={claim.confidence} variant="bar" />
                </div>

                {/* Supporting Signals */}
                <div className="evidence-chain">
                  {claim.supporting_signals.map((s, i) => (
                    <div key={i} className="evidence-chain-node text-[11px] text-slate-400 font-mono py-0.5">
                      {s}
                    </div>
                  ))}
                </div>

                {/* Source URLs */}
                <div className="flex flex-wrap gap-1.5">
                  {claim.sources.filter(Boolean).map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900 hover:border-cyan-500 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Source {i + 1}
                    </a>
                  ))}
                </div>

                {/* Footer: timestamp + copy action */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-slate-600">{claim.retrieval_timestamp}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy Claim'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CrossLinkHighlight>
  );
};
