import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicProfile } from '../../types/intelligence';
import { ExternalLink, BadgeCheck, Users, ChevronDown, Link2 } from 'lucide-react';
import { ConfidenceGauge } from '../shared/ConfidenceGauge';
import { CrossLinkHighlight } from '../shared/CrossLinkHighlight';

interface ProfileListProps {
  profiles: PublicProfile[];
  highlightedId?: string | null;
  onHighlight?: (id: string) => void;
}

export const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  highlightedId,
  onHighlight,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!profiles.length) {
    return <p className="text-xs font-mono text-slate-500 py-6 text-center">No public profiles resolved.</p>;
  }

  const toggleExpand = (key: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {profiles.map((p) => {
        const key = `${p.platform}-${p.username}`;
        const isExpanded = expandedIds.has(key);

        return (
          <CrossLinkHighlight key={key} id={`profile-${key}`} activeHighlightId={highlightedId || null}>
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition-all overflow-hidden">
              {/* Collapsed summary — always visible */}
              <button
                onClick={() => toggleExpand(key)}
                className="w-full p-4 text-left expand-trigger"
              >
                <div className="flex items-start gap-3">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.username} className="w-10 h-10 rounded-lg object-cover border border-slate-700 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-mono text-xs flex-shrink-0">
                      {p.platform.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-slate-500 uppercase">{p.platform}</p>
                        <p className="text-sm font-semibold text-white truncate">{p.display_name}</p>
                        <p className="text-xs font-mono text-cyan-400">@{p.username}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ConfidenceGauge value={Math.round(p.evidence_score * 100)} size="xs" />
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 expand-icon ${isExpanded ? 'expand-icon-open' : ''}`} />
                      </div>
                    </div>

                    {/* Quick badges row */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {p.verified_link && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800">
                          <BadgeCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {typeof p.followers_count === 'number' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
                          <Users className="w-3 h-3" /> {p.followers_count.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
                      {/* Bio */}
                      {p.bio && <p className="text-[11px] text-slate-400 leading-relaxed">{p.bio}</p>}

                      {/* Evidence Score Bar */}
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 block mb-1">Evidence Score</span>
                        <ConfidenceGauge value={Math.round(p.evidence_score * 100)} variant="bar" />
                      </div>

                      {/* Match Reasons */}
                      {p.match_reasons.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block mb-1">Match Reasons</span>
                          <div className="flex flex-wrap gap-1">
                            {p.match_reasons.map((reason, i) => (
                              <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                                <Link2 className="w-2.5 h-2.5 inline mr-0.5 text-cyan-500" />
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Source Link */}
                      <a
                        href={p.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Inspect Source →
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CrossLinkHighlight>
        );
      })}
    </div>
  );
};
