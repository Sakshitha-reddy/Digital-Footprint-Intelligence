import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityItem } from '../../types/intelligence';
import {
  Clock, Code2, Trophy, BookOpen, Briefcase, GraduationCap,
  FileText, ExternalLink, Filter, ChevronDown
} from 'lucide-react';
import { ConfidenceGauge } from '../shared/ConfidenceGauge';
import { ProvenanceBadge } from '../shared/ProvenanceBadge';
import { CrossLinkHighlight } from '../shared/CrossLinkHighlight';

interface ActivityTimelineProps {
  timeline: ActivityItem[];
  highlightedId?: string | null;
  onHighlight?: (id: string) => void;
}

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; ring: string; barColor: string }> = {
  Repositories: { icon: <Code2 className="w-4 h-4" />, color: 'text-emerald-400', ring: 'border-emerald-500/50 bg-emerald-950', barColor: 'bg-emerald-500' },
  Hackathons: { icon: <Trophy className="w-4 h-4" />, color: 'text-amber-400', ring: 'border-amber-500/50 bg-amber-950', barColor: 'bg-amber-500' },
  Conferences: { icon: <Trophy className="w-4 h-4" />, color: 'text-cyan-400', ring: 'border-cyan-500/50 bg-cyan-950', barColor: 'bg-cyan-500' },
  Publications: { icon: <BookOpen className="w-4 h-4" />, color: 'text-sky-400', ring: 'border-sky-500/50 bg-sky-950', barColor: 'bg-sky-500' },
  Patents: { icon: <FileText className="w-4 h-4" />, color: 'text-violet-400', ring: 'border-violet-500/50 bg-violet-950', barColor: 'bg-violet-500' },
  Career: { icon: <Briefcase className="w-4 h-4" />, color: 'text-blue-400', ring: 'border-blue-500/50 bg-blue-950', barColor: 'bg-blue-500' },
  Education: { icon: <GraduationCap className="w-4 h-4" />, color: 'text-fuchsia-400', ring: 'border-fuchsia-500/50 bg-fuchsia-950', barColor: 'bg-fuchsia-500' },
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  timeline,
  highlightedId,
  onHighlight,
}) => {
  const [filter, setFilter] = useState<string>('All');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const cats = Array.from(new Set(timeline.map((t) => t.category)));
    return ['All', ...cats];
  }, [timeline]);

  const filtered = filter === 'All' ? timeline : timeline.filter((t) => t.category === filter);

  // Density heatmap data — group by category for visual
  const densityData = useMemo(() => {
    const catCounts: Record<string, number> = {};
    timeline.forEach((t) => {
      catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    });
    return Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  }, [timeline]);

  const maxDensity = Math.max(...densityData.map(([, c]) => c), 1);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="cyber-card p-6 sm:p-8 rounded-2xl border border-white/[0.07]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h3 className="text-sm font-bold font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Chronological Digital Footprint
          <span className="text-slate-600 font-normal">({filtered.length})</span>
        </h3>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition-all border ${
                filter === c
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Density Heatmap */}
      {densityData.length > 1 && (
        <div className="density-heatmap mb-5 px-1">
          {densityData.map(([cat, count]) => {
            const meta = CATEGORY_META[cat] || CATEGORY_META.Repositories;
            const height = Math.max(15, (count / maxDensity) * 100);
            return (
              <div
                key={cat}
                className={`density-heatmap-bar ${meta.barColor} opacity-60`}
                style={{ height: `${height}%` }}
                title={`${cat}: ${count} items`}
                onClick={() => setFilter(cat)}
              />
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-xs font-mono text-slate-500 text-center py-8">No milestones in this category.</p>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-3.5 top-1 bottom-1 w-px bg-gradient-to-b from-cyan-500/60 via-slate-700 to-transparent" />
          <div className="space-y-3">
            {filtered.map((item, idx) => {
              const meta = CATEGORY_META[item.category] || CATEGORY_META.Repositories;
              const isExpanded = expandedIds.has(item.id);
              const isLowConfidence = item.confidence < 0.6;

              return (
                <CrossLinkHighlight key={item.id} id={`timeline-${item.id}`} activeHighlightId={highlightedId || null}>
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, type: 'spring', stiffness: 320, damping: 28 }}
                    className={`relative ${isLowConfidence ? 'opacity-70' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute -left-8 top-3 w-6 h-6 rounded-full border flex items-center justify-center ${meta.ring} ${meta.color}`}>
                      {meta.icon}
                    </div>

                    {/* Card — Collapsed by default */}
                    <div className="rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition-colors overflow-hidden">
                      {/* Summary row (always visible) */}
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="w-full p-3.5 flex items-center justify-between text-left expand-trigger"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] font-mono text-slate-600 w-20 flex-shrink-0">{item.date}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${meta.ring} ${meta.color} flex-shrink-0`}>
                            {item.category}
                          </span>
                          <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <ConfidenceGauge value={Math.round(item.confidence * 100)} size="xs" showLabel={false} />
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 expand-icon ${isExpanded ? 'expand-icon-open' : ''}`} />
                        </div>
                      </button>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 space-y-2 border-t border-white/[0.04] pt-3">
                              {item.organization && (
                                <p className="text-[11px] font-mono text-cyan-400/80">{item.organization}</p>
                              )}
                              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                              <div className="flex items-center gap-3 pt-1">
                                <ProvenanceBadge platform={item.source_platform} url={item.source_url} />
                                <span className="text-[10px] font-mono text-slate-500">
                                  Confidence {Math.round(item.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </CrossLinkHighlight>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
