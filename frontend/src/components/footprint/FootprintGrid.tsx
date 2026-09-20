import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ActivityItem, PublicProfile } from '../../types/intelligence';
import { ProfileList } from './ProfileList';
import {
  Code2, Trophy, BookOpen, FileText, Briefcase, GraduationCap,
  Star, ExternalLink, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { ConfidenceGauge } from '../shared/ConfidenceGauge';
import { ProvenanceBadge } from '../shared/ProvenanceBadge';
import { CrossLinkHighlight } from '../shared/CrossLinkHighlight';

interface FootprintGridProps {
  activities: ActivityItem[];
  profiles: PublicProfile[];
  highlightedId?: string | null;
  onHighlight?: (id: string) => void;
}

const CAT_ICON: Record<string, React.ReactNode> = {
  Repositories: <Code2 className="w-3.5 h-3.5" />,
  Hackathons: <Trophy className="w-3.5 h-3.5" />,
  Conferences: <Trophy className="w-3.5 h-3.5" />,
  Publications: <BookOpen className="w-3.5 h-3.5" />,
  Patents: <FileText className="w-3.5 h-3.5" />,
  Career: <Briefcase className="w-3.5 h-3.5" />,
  Education: <GraduationCap className="w-3.5 h-3.5" />,
};

type SortMode = 'date' | 'confidence';

export const FootprintGrid: React.FC<FootprintGridProps> = ({
  activities,
  profiles,
  highlightedId,
  onHighlight,
}) => {
  const groups = useMemo(() => {
    const map: Record<string, ActivityItem[]> = {};
    for (const a of activities) {
      (map[a.category] ||= []).push(a);
    }
    return map;
  }, [activities]);

  const cats = Object.keys(groups);
  const [active, setActive] = useState<string>(cats[0] || 'Repositories');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const items = useMemo(() => {
    const list = groups[active] || [];
    return [...list].sort((a, b) => {
      if (sortMode === 'confidence') return b.confidence - a.confidence;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [groups, active, sortMode]);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Profiles Section */}
      <div className="cyber-card p-5 rounded-2xl border border-white/[0.07]">
        <h3 className="text-sm font-bold font-mono text-cyan-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          Resolved Public Accounts
          <span className="text-slate-600 font-normal">({profiles.length})</span>
        </h3>
        <ProfileList profiles={profiles} highlightedId={highlightedId} onHighlight={onHighlight} />
      </div>

      {/* Activities Section */}
      <div className="cyber-card p-5 rounded-2xl border border-white/[0.07]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold font-mono text-cyan-300 uppercase tracking-wider">
            Aggregated Digital Assets
          </h3>
          {/* Sort control */}
          <button
            onClick={() => setSortMode(sortMode === 'date' ? 'confidence' : 'date')}
            className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors self-start"
          >
            <ArrowUpDown className="w-3 h-3" />
            Sort: {sortMode === 'date' ? 'Date' : 'Confidence'}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${
                active === c
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
              }`}
            >
              {CAT_ICON[c]}
              {c}
              <span className="text-[10px] opacity-70">({groups[c].length})</span>
            </button>
          ))}
        </div>

        {/* Activity Cards with progressive disclosure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item, idx) => {
            const isExpanded = expandedCards.has(item.id);
            const isLowConfidence = item.confidence < 0.6;

            return (
              <CrossLinkHighlight key={item.id} id={`activity-${item.id}`} activeHighlightId={highlightedId || null}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
                  className={`rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition-all overflow-hidden ${
                    isLowConfidence ? 'opacity-75' : ''
                  }`}
                >
                  {/* Summary (always visible) */}
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full p-4 text-left expand-trigger"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-mono text-slate-500">{item.date} · {item.source_platform}</p>
                        <h4 className="text-sm font-semibold text-white mt-0.5 truncate">{item.title}</h4>
                        {item.organization && (
                          <p className="text-[11px] font-mono text-cyan-400/80 truncate">{item.organization}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ConfidenceGauge value={Math.round(item.confidence * 100)} size="xs" showLabel={false} />
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 expand-icon ${isExpanded ? 'expand-icon-open' : ''}`} />
                      </div>
                    </div>

                    {/* Metadata badges (stars, language) */}
                    {item.metadata?.stars != null && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-mono text-amber-400">
                        <Star className="w-3 h-3" /> {item.metadata.stars} stars
                      </span>
                    )}
                    {item.metadata?.language && (
                      <span className="inline-flex items-center gap-1 mt-2 ml-2 text-[10px] font-mono text-slate-400">
                        {item.metadata.language}
                      </span>
                    )}
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-white/[0.04] pt-3">
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                      <div className="flex items-center gap-3">
                        <ProvenanceBadge platform={item.source_platform} url={item.source_url} />
                        <span className="text-[10px] font-mono text-slate-500">
                          Confidence {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </CrossLinkHighlight>
            );
          })}
        </div>
      </div>
    </div>
  );
};
