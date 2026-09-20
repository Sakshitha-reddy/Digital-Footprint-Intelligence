import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvestigationResult } from '../../types/intelligence';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, Globe, MapPin, Building,
  ChevronDown, Eye, Network, ExternalLink
} from 'lucide-react';
import { ConfidenceGauge } from '../shared/ConfidenceGauge';
import { ProvenanceBadge } from '../shared/ProvenanceBadge';
import { CrossLinkHighlight } from '../shared/CrossLinkHighlight';

interface IdentityHeroProps {
  result: InvestigationResult;
  onOpenEvidence: () => void;
  onHighlight?: (id: string) => void;
  highlightedId?: string | null;
}

export const IdentityHero: React.FC<IdentityHeroProps> = ({
  result,
  onOpenEvidence,
  onHighlight,
  highlightedId,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isHighConfidence = result.overall_confidence >= 80;
  const isMediumConfidence = result.overall_confidence >= 60 && result.overall_confidence < 80;

  return (
    <div className="bg-[#091326]/50 backdrop-blur-2xl border border-slate-400/15 p-6 lg:p-8 rounded-2xl relative overflow-hidden space-y-0 shadow-2xl">
      {/* Background ambient lighting */}
      <div
        className={`absolute -right-20 -top-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isHighConfidence ? 'bg-emerald-500/8' : isMediumConfidence ? 'bg-amber-500/8' : 'bg-rose-500/8'
        }`}
      />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full blur-3xl pointer-events-none bg-blue-500/5" />

      {/* Main Header Row: Avatar, Identity Info & Confidence Gauge */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 relative z-10">
        {/* Left: Avatar & Identity */}
        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={result.target_summary.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
              alt={result.likely_identity}
              className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl object-cover border border-white/10 ring-2 ring-blue-500/20 shadow-xl"
              style={{ width: 72, height: 72 }}
            />
            <span
              className={`absolute -bottom-1 -right-1 p-1 rounded-full border shadow-sm ${
                isHighConfidence
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-950 text-amber-400 border-amber-500/40'
              }`}
            >
              {isHighConfidence ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans truncate">
                {result.likely_identity}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> PROVENANCE VERIFIED
              </span>
            </div>

            {/* Context Attributes with inline provenance */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
              {result.target_summary.affiliation && (
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Building className="w-3.5 h-3.5 text-blue-400" />
                  <span>{result.target_summary.affiliation}</span>
                </div>
              )}
              {result.target_summary.location && (
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{result.target_summary.location}</span>
                </div>
              )}
            </div>

            {/* Correlated Aliases — Cross-link enabled */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="text-[11px] font-medium text-slate-500">Aliases:</span>
              {result.aliases.map((alias, idx) => (
                <CrossLinkHighlight key={idx} id={`alias-${alias}`} activeHighlightId={highlightedId || null}>
                  <button
                    onClick={() => onHighlight?.(`alias-${alias}`)}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-900/80 text-blue-300 border border-slate-700/80 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-pointer"
                  >
                    {alias}
                  </button>
                </CrossLinkHighlight>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Confidence Gauge */}
        <div className="flex items-center gap-4 bg-slate-900/80 px-5 py-3 rounded-xl border border-white/[0.08] shadow-sm w-full xl:w-auto justify-between sm:justify-start">
          <ConfidenceGauge value={result.overall_confidence} size="lg" />
          <div className="text-left">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Evidence Score
            </span>
            <span
              className={`text-xs font-bold ${
                isHighConfidence ? 'text-emerald-400' : isMediumConfidence ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {isHighConfidence ? 'STRONG CORROBORATION' : isMediumConfidence ? 'MODERATE MATCH' : 'HIGH UNCERTAINTY'}
            </span>
            <button
              onClick={onOpenEvidence}
              className="mt-1 block text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              View Evidence Proof →
            </button>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="expand-trigger flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-cyan-400 mt-4 mb-1 transition-colors"
      >
        <ChevronDown className={`w-3.5 h-3.5 expand-icon ${expanded ? 'expand-icon-open' : ''}`} />
        {expanded ? 'Collapse Details' : 'Show Full Investigation Summary'}
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 pb-4">
              <MetricCard
                label="Resolved Accounts"
                value={`${result.profiles.length} Profiles`}
                icon={<Globe className="w-4 h-4" />}
                color="blue"
              />
              <MetricCard
                label="CESV Verified"
                value={`${result.claims.filter(c => c.status === 'CONFIRMED').length}/${result.claims.length}`}
                icon={<ShieldCheck className="w-4 h-4" />}
                color="emerald"
              />
              <MetricCard
                label="Anomalies"
                value={`${result.conflicts.length} Flags`}
                icon={<AlertTriangle className="w-4 h-4" />}
                color={result.conflicts.length > 0 ? 'amber' : 'slate'}
              />
              <MetricCard
                label="Visual Match"
                value={`${Math.round(result.visual_similarity_score * 100)}% Vector`}
                icon={<Eye className="w-4 h-4" />}
                color="blue"
              />
            </div>

            {/* Source Provenance Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {result.profiles.map((p) => (
                <ProvenanceBadge
                  key={`${p.platform}-${p.username}`}
                  platform={p.platform}
                  url={p.profile_url}
                  verified={p.verified_link}
                />
              ))}
            </div>

            {/* Verdict */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.06] text-xs text-slate-200 leading-relaxed flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-semibold mr-1.5">INTELLIGENCE VERDICT:</strong>
                <span className="text-slate-300">{result.summary_verdict}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component: Metric Card
const MetricCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    slate: 'bg-slate-800 border-slate-700 text-slate-400',
  };

  return (
    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.05] flex items-center justify-between">
      <div>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-base font-bold text-white tracking-tight mt-0.5">{value}</p>
      </div>
      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${colorMap[color] || colorMap.slate}`}>
        {icon}
      </div>
    </div>
  );
};
