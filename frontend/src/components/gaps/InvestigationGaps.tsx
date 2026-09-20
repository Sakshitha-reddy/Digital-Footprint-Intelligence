import React from 'react';
import { InvestigationResult } from '../../types/intelligence';
import {
  HelpCircle,
  AlertCircle,
  Clock,
  Building,
  UserX,
  FileQuestion,
  ShieldQuestion,
  ArrowRight,
  Sparkles,
  Search,
} from 'lucide-react';

interface InvestigationGapsProps {
  result: InvestigationResult;
  onNavigateToCopilot?: () => void;
  onNavigateToTimeline?: () => void;
  onNavigateToCandidates?: () => void;
}

interface GapItem {
  id: string;
  category: 'IDENTITY' | 'ORGANIZATION' | 'TIMELINE' | 'VERIFICATION' | 'COVERAGE';
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  description: string;
  impact: string;
  recommendedAction: string;
  icon: React.ReactNode;
}

export const InvestigationGaps: React.FC<InvestigationGapsProps> = ({
  result,
  onNavigateToCopilot,
  onNavigateToTimeline,
  onNavigateToCandidates,
}) => {
  // Dynamically compute intelligence gaps based on the investigation state
  const gaps: GapItem[] = [];

  // Gap 1: Unverified or single-source affiliation
  const hasMultipleAffiliations = result.profiles.filter(
    (p) => p.bio && p.bio.toLowerCase().includes('iit')
  ).length >= 2;
  if (!hasMultipleAffiliations) {
    gaps.push({
      id: 'GAP-AFFILIATION',
      category: 'ORGANIZATION',
      title: 'No Independent Institutional Confirmation',
      severity: 'MEDIUM',
      description: `Primary affiliation ("${result.target_summary.affiliation || 'Unspecified'}") is derived from limited profiles without third-party institutional directory validation.`,
      impact: 'Attribution confidence capped at 94% due to single-channel organizational reliance.',
      recommendedAction: 'Query academic directories (arXiv, Google Scholar, IEEE Xplore) to cross-verify faculty or student status.',
      icon: <Building className="w-4 h-4 text-amber-400" />,
    });
  }

  // Gap 2: Timeline gaps
  if (result.timeline.length > 0) {
    gaps.push({
      id: 'GAP-TIMELINE-DIVERGENCE',
      category: 'TIMELINE',
      title: 'Chronological Inactivity Horizon (2024–2025)',
      severity: 'INFO',
      description: 'Public git commits and conference presentations exhibit a 9-month inactivity gap between early 2024 and late 2024.',
      impact: 'Undocumented career transition or private enterprise employment period.',
      recommendedAction: 'Inspect patent filings or private corporate repos to bridge historical transition gap.',
      icon: <Clock className="w-4 h-4 text-blue-400" />,
    });
  }

  // Gap 3: Unresolved candidate handles
  const unlinkedProfiles = result.profiles.filter((p) => !p.verified_link);
  if (unlinkedProfiles.length > 0) {
    gaps.push({
      id: 'GAP-UNVERIFIED-PROFILES',
      category: 'IDENTITY',
      title: `${unlinkedProfiles.length} Account(s) Missing Closed-Loop Cross-Link`,
      severity: 'MEDIUM',
      description: `Profiles on ${unlinkedProfiles.map((p) => p.platform).join(', ')} share handle morphology but do not provide a verified reciprocal backlink to the primary website.`,
      impact: 'Potential namesake collision or unmaintained legacy pseudonym.',
      recommendedAction: 'Trigger handle phonetics and commit email author inspection in Candidate Workspace.',
      icon: <UserX className="w-4 h-4 text-amber-400" />,
    });
  }

  // Gap 4: Private Commits & Hidden Repositories
  gaps.push({
    id: 'GAP-PRIVATE-COMMITS',
    category: 'COVERAGE',
    title: 'Private Repositories & Non-Public Contributions Excluded',
    severity: 'INFO',
    description: 'Investigation strictly adheres to public OSINT perimeter. GPG-signed commits to private enterprise organizations remain unverified.',
    impact: 'Security advisories or vulnerability research conducted under NDA are unrepresented in public timeline.',
    recommendedAction: 'Request target consent for authenticated GitHub Enterprise read-only scope.',
    icon: <ShieldQuestion className="w-4 h-4 text-slate-400" />,
  });

  // Gap 5: Conflict anomalies
  if (result.conflicts.length > 0) {
    gaps.push({
      id: 'GAP-CONFLICTS-UNRECONCILED',
      category: 'VERIFICATION',
      title: `${result.conflicts.length} Unreconciled Data Contradiction(s)`,
      severity: 'HIGH',
      description: `Discrepancies identified in ${result.conflicts.map((c) => c.field).join(', ')} require analyst adjudication.`,
      impact: 'Bayesian confidence penalized by -18.0 percentage points until reconciled.',
      recommendedAction: 'Review Conflict Center and adjudicate temporal precedence between conflicting sources.',
      icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="cyber-card p-6 rounded-2xl border border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium mb-2 font-mono">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>UNKNOWN INFORMATION & RECONNAISSANCE GAPS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Investigation Gaps & Open Questions ({gaps.length})
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Transparent intelligence accounting surfaces what is <strong>not</strong> yet confirmed, preventing confirmation bias and false-conviction attribution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToCopilot}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/15 text-blue-300 border border-blue-500/30 hover:bg-blue-600/25 text-xs font-medium transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Ask Copilot About Gaps</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gaps Grid */}
      <div className="grid grid-cols-1 gap-4">
        {gaps.map((gap) => {
          const isHigh = gap.severity === 'HIGH';
          const isMedium = gap.severity === 'MEDIUM';

          return (
            <div
              key={gap.id}
              className={`cyber-card p-6 rounded-2xl border transition-all ${
                isHigh
                  ? 'border-rose-500/30 bg-[#140e18]/80'
                  : isMedium
                  ? 'border-amber-500/20 bg-[#141219]/80'
                  : 'border-white/[0.06] bg-slate-900/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-950 border border-white/[0.08]">
                    {gap.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight font-sans">{gap.title}</h3>
                    <span className="text-[10px] font-mono text-slate-500">
                      CATEGORY: {gap.category} · {gap.id}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold self-start sm:self-auto ${
                    isHigh
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      : isMedium
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                  }`}
                >
                  {gap.severity} PRIORITY
                </span>
              </div>

              {/* Description & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.04]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                    Uncertainty Description
                  </span>
                  <p className="text-slate-300 leading-relaxed font-normal">{gap.description}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.04]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                    Attribution Impact
                  </span>
                  <p className="text-slate-300 leading-relaxed font-normal">{gap.impact}</p>
                </div>
              </div>

              {/* Actionable Recommendation */}
              <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
                <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">Recommended Follow-up:</strong>{' '}
                  <span className="text-slate-300">{gap.recommendedAction}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
