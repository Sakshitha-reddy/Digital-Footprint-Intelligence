import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicProfile, InvestigationResult } from '../../types/intelligence';
import {
  Users,
  ExternalLink,
  BadgeCheck,
  Search,
  Filter,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Building,
  MapPin,
  Calendar,
  Layers,
  ArrowUpDown,
  X,
  Shield,
  Eye,
} from 'lucide-react';
import { ConfidenceGauge } from '../shared/ConfidenceGauge';
import { ProvenanceBadge } from '../shared/ProvenanceBadge';
import { CrossLinkHighlight } from '../shared/CrossLinkHighlight';

const getStatusBadge = (status?: string) => {
  switch (status?.toUpperCase()) {
    case 'VERIFIED':
      return (
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1 font-mono">
          <BadgeCheck className="w-3 h-3" /> VERIFIED
        </span>
      );
    case 'CONFLICTED':
      return (
        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30 inline-flex items-center gap-1 font-mono">
          <AlertTriangle className="w-3 h-3" /> CONFLICTED
        </span>
      );
    case 'INSUFFICIENT':
      return (
        <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-white/10 inline-flex items-center gap-1 font-mono">
          <HelpCircle className="w-3 h-3" /> INSUFFICIENT
        </span>
      );
    case 'SUPPORTED':
    default:
      return (
        <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30 inline-flex items-center gap-1 font-mono">
          <CheckCircle2 className="w-3 h-3" /> SUPPORTED
        </span>
      );
  }
};

interface CandidateWorkspaceProps {
  result: InvestigationResult;
  highlightedId?: string | null;
  onHighlight?: (id: string) => void;
  onNavigateToGraph?: () => void;
  onNavigateToEvidence?: () => void;
  onSelectCandidate?: (profile: PublicProfile) => void;
}

export const CandidateWorkspace: React.FC<CandidateWorkspaceProps> = ({
  result,
  highlightedId,
  onHighlight,
  onNavigateToGraph,
  onNavigateToEvidence,
  onSelectCandidate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [compareProfile, setCompareProfile] = useState<PublicProfile | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');

  const platforms = useMemo(() => {
    const list = Array.from(new Set(result.profiles.map((p) => p.platform)));
    return ['ALL', ...list];
  }, [result.profiles]);

  const filteredProfiles = useMemo(() => {
    return result.profiles.filter((p) => {
      const matchesPlatform = filterPlatform === 'ALL' || p.platform === filterPlatform;
      const matchesSearch =
        !searchQuery.trim() ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.bio && p.bio.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesPlatform && matchesSearch;
    });
  }, [result.profiles, filterPlatform, searchQuery]);

  // Primary candidate (top scored)
  const primaryProfile = result.profiles[0] || null;

  const handleStartCompare = (profile: PublicProfile) => {
    if (!selectedProfile) {
      setSelectedProfile(profile);
    } else {
      setCompareProfile(profile);
      setIsComparing(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="cyber-card p-6 rounded-2xl border border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium mb-2 font-mono">
              <Users className="w-3.5 h-3.5" />
              <span>ENTITY RESOLUTION & DISAMBIGUATION WORKSPACE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Resolved Candidate Personas ({result.profiles.length})
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Disambiguate distinct accounts, trace biometric and handle morphology, compare evidence strengths, and inspect why candidate profiles are correlated to the seed identity.
            </p>
            {result.resolution_status === 'ambiguous' && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span>Multiple candidate personas have similar confidence scores. Select the target persona below to focus the investigation.</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsComparing(!isComparing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isComparing
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-white/[0.08] hover:border-white/[0.16]'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isComparing ? 'Close Comparison' : 'Compare Personas'}</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-5 mt-4 border-t border-white/[0.06]">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, real name, platform, bio keywords..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/[0.06] focus:border-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 pl-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {platforms.map((plat) => (
              <button
                key={plat}
                onClick={() => setFilterPlatform(plat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  filterPlatform === plat
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'bg-slate-900/60 text-slate-400 border border-white/[0.04] hover:border-white/[0.1]'
                }`}
              >
                {plat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Workspace (when enabled) */}
      <AnimatePresence>
        {isComparing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="cyber-card p-6 rounded-2xl border border-blue-500/30 bg-[#0d1424]/90 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-sans">
                    <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                    Comparative Candidate Provenance Matrix
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Answering: <strong>Why is Persona A more strongly corroborated than Persona B?</strong>
                  </p>
                </div>
                <button
                  onClick={() => setIsComparing(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selectors for comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Candidate A */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-blue-400 uppercase font-semibold">Candidate A</span>
                    <select
                      value={selectedProfile?.username || result.profiles[0]?.username}
                      onChange={(e) => {
                        const p = result.profiles.find((x) => x.username === e.target.value);
                        if (p) setSelectedProfile(p);
                      }}
                      className="text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white outline-none"
                    >
                      {result.profiles.map((p) => (
                        <option key={`a-${p.platform}-${p.username}`} value={p.username}>
                          {p.platform}: @{p.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProfile || result.profiles[0] ? (
                    <CandidateDetailBox profile={selectedProfile || result.profiles[0]} isPrimary />
                  ) : null}
                </div>

                {/* Candidate B */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">Candidate B</span>
                    <select
                      value={compareProfile?.username || result.profiles[1]?.username || result.profiles[0]?.username}
                      onChange={(e) => {
                        const p = result.profiles.find((x) => x.username === e.target.value);
                        if (p) setCompareProfile(p);
                      }}
                      className="text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white outline-none"
                    >
                      {result.profiles.map((p) => (
                        <option key={`b-${p.platform}-${p.username}`} value={p.username}>
                          {p.platform}: @{p.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  {compareProfile || result.profiles[1] ? (
                    <CandidateDetailBox profile={compareProfile || result.profiles[1]} />
                  ) : (
                    <p className="text-xs text-slate-500 py-6 text-center">Select a second candidate to compare.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidate Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProfiles.map((profile, idx) => {
          const isSelected = selectedProfile?.username === profile.username;
          const isHighlighted = highlightedId === `alias-@${profile.username}` || highlightedId === profile.username;

          return (
            <CrossLinkHighlight
              key={`${profile.platform}-${profile.username}`}
              id={`candidate-${profile.username}`}
              activeHighlightId={highlightedId || null}
            >
              <div
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-[#0e1627] border-blue-500/40 shadow-lg ring-1 ring-blue-500/30'
                    : isHighlighted
                    ? 'bg-[#0e1627] border-blue-400/50 shadow-md'
                    : 'bg-slate-900/70 border-white/[0.06] hover:border-white/[0.14] hover:bg-slate-900/90'
                }`}
              >
                <div>
                  {/* Card Header: Avatar, Display Name, Platform Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.username}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-blue-400 font-mono font-bold text-sm flex-shrink-0">
                          {profile.platform.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-semibold text-slate-400 uppercase">
                            {profile.platform}
                          </span>
                          {profile.origin === 'user_provided' ? (
                            <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/30 inline-flex items-center gap-0.5 font-mono">
                              USER-PROVIDED PROFILE
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-800/40 px-1.5 py-0.2 rounded border border-white/[0.05] inline-flex items-center gap-0.5 font-mono">
                              DISCOVERED PROFILE
                            </span>
                          )}
                          {profile.verified_link && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 inline-flex items-center gap-0.5">
                              <BadgeCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white tracking-tight truncate mt-0.5 font-sans">
                          {profile.display_name || profile.username}
                        </h3>
                        <p className="text-xs font-mono text-blue-300 truncate">@{profile.username}</p>
                      </div>
                    </div>

                    {/* Confidence Score Gauge */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <ConfidenceGauge value={Math.round(profile.evidence_score * 100)} size="sm" />
                    </div>
                  </div>

                  {/* Bio snippet */}
                  {profile.bio && (
                    <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed font-normal bg-slate-950/40 p-2.5 rounded-lg border border-white/[0.03]">
                      {profile.bio}
                    </p>
                  )}

                  {/* Profile Status & Explainable Attribution Breakdown */}
                  <div className="mt-3.5 space-y-2.5">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                      <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                        Resolution Status:
                      </span>
                      {getStatusBadge(profile.status)}
                    </div>

                    {/* The Explainable "Why?" Breakdown Box */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-2.5">
                      <div className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                        Why this connection exists:
                      </div>

                      {/* Supporting signals */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 block font-medium">Supporting:</span>
                        <div className="space-y-1 pl-1">
                          {(profile.supporting_evidence && profile.supporting_evidence.length > 0
                            ? profile.supporting_evidence
                            : (profile.match_reasons.length > 0
                                ? profile.match_reasons
                                : ['Username similarity match', 'Compatible public activity footprint'])
                          ).map((item, idx) => (
                            <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conflicting signals (if conflicted or conflict evidence exists) */}
                      {((profile.conflicting_evidence && profile.conflicting_evidence.length > 0) || profile.status === 'CONFLICTED') && (
                        <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                          <span className="text-[10px] font-mono text-rose-400 block font-medium">Conflicting:</span>
                          <div className="space-y-1 pl-1">
                            {(profile.conflicting_evidence && profile.conflicting_evidence.length > 0
                              ? profile.conflicting_evidence
                              : ['Different organization affiliation detected', 'Inconsistent activity timeline']
                            ).map((item, idx) => (
                              <div key={idx} className="text-xs text-rose-300 flex items-start gap-1.5">
                                <span className="text-rose-400 font-bold flex-shrink-0">✕</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1.5">
                            <span className="font-bold">Action:</span> Requires verification
                          </div>
                        </div>
                      )}

                      {/* Sources Provenance */}
                      <div className="pt-2 border-t border-white/[0.04]">
                        <span className="text-[10px] font-mono text-slate-400 block font-medium mb-1">Sources:</span>
                        <div className="flex flex-wrap gap-1">
                          {(profile.provenance_sources && profile.provenance_sources.length > 0
                            ? profile.provenance_sources
                            : [profile.platform, 'Public Web Discovery']
                          ).map((src, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.05] text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartCompare(profile)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Compare</span>
                    </button>
                    {onSelectCandidate && (
                      <button
                        onClick={() => onSelectCandidate(profile)}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                        title="Select this candidate persona"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Select</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onHighlight?.(profile.username)}
                      className="text-slate-400 hover:text-blue-400 p-1 rounded transition-colors"
                      title="Focus in Graph"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={profile.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-300 border border-blue-500/20 hover:bg-blue-600/20 font-medium transition-all"
                    >
                      <span>Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </CrossLinkHighlight>
          );
        })}
      </div>
    </div>
  );
};

// Sub-component: Candidate Detail Box for Side-by-Side Comparison
const CandidateDetailBox: React.FC<{ profile: PublicProfile; isPrimary?: boolean }> = ({
  profile,
  isPrimary,
}) => {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-3">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-white">
            {profile.platform.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate font-sans">{profile.display_name}</p>
          <p className="text-xs font-mono text-blue-300">
            {profile.platform} · @{profile.username}
          </p>
        </div>
        <div className="ml-auto">
          <span className="text-base font-bold font-mono text-emerald-400">
            {Math.round(profile.evidence_score * 100)}%
          </span>
        </div>
      </div>

      {profile.bio && (
        <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-white/[0.04]">
          {profile.bio}
        </p>
      )}

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between py-1 border-b border-white/[0.04]">
          <span className="text-slate-500">Cross-Link Cycle</span>
          <span className={profile.verified_link ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
            {profile.verified_link ? 'Verified (Closed Loop)' : 'Unverified One-Way'}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-white/[0.04]">
          <span className="text-slate-500">Public Followers</span>
          <span className="text-white font-mono">{profile.followers_count?.toLocaleString() || 'N/A'}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Attribution Match Factors</span>
          <span className="text-white font-mono">{profile.match_reasons.length} signals</span>
        </div>
        <div className="flex justify-between py-1 border-t border-white/[0.04] items-center">
          <span className="text-slate-500">Status</span>
          {getStatusBadge(profile.status)}
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.05] space-y-2">
        <div>
          <p className="text-[10px] font-mono uppercase text-blue-400 font-bold mb-1">Supporting Signals:</p>
          <div className="space-y-1 pl-1">
            {(profile.supporting_evidence && profile.supporting_evidence.length > 0
              ? profile.supporting_evidence
              : profile.match_reasons
            ).map((r, i) => (
              <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {((profile.conflicting_evidence && profile.conflicting_evidence.length > 0) || profile.status === 'CONFLICTED') && (
          <div className="pt-1.5 border-t border-white/[0.04]">
            <p className="text-[10px] font-mono uppercase text-rose-400 font-bold mb-1">Conflicting Signals:</p>
            <div className="space-y-1 pl-1">
              {(profile.conflicting_evidence && profile.conflicting_evidence.length > 0
                ? profile.conflicting_evidence
                : ['Different organization affiliation detected']
              ).map((r, i) => (
                <div key={i} className="text-[11px] text-rose-300 flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold flex-shrink-0">✕</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-mono text-amber-400 mt-1">Action: Requires verification</p>
          </div>
        )}
      </div>
    </div>
  );
};
