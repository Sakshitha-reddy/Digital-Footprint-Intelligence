import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExposureIntelligence } from '../../types/intelligence';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  ExternalLink,
  AlertOctagon,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck2,
} from 'lucide-react';

interface ExposureIntelligenceCardProps {
  exposure?: ExposureIntelligence | null;
}

export const ExposureIntelligenceCard: React.FC<ExposureIntelligenceCardProps> = ({ exposure }) => {
  const [expanded, setExpanded] = useState(false);

  if (!exposure) return null;

  const hasBreaches = exposure.has_exposure && exposure.items && exposure.items.length > 0;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0b101e]/80 backdrop-blur-md overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-900/60 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${hasBreaches ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            {hasBreaches ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-white">
                EXPOSURE INTELLIGENCE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                PUBLIC ADVISORIES ONLY
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Legitimate public breach disclosures & vulnerability registries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasBreaches ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono font-semibold">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{exposure.total_findings} Public Exposure{exposure.total_findings !== 1 ? 's' : ''} Flagged</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>No Reported Exposures</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 space-y-4">
        {/* Exposure Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Publicly Reported Exposure */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Publicly reported exposure:</span>
              <span className={`text-xs font-mono font-bold ${hasBreaches ? 'text-amber-400' : 'text-emerald-400'}`}>
                {hasBreaches ? '✓ Found' : '✓ Clean / None Reported'}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 pl-3 border-l border-white/[0.08] space-y-0.5">
              <div>└── Source: <span className="text-blue-300">Authorized Public Breach-Notification Repositories</span></div>
              {exposure.email_checked && (
                <div>└── Target Seed: <span className="text-slate-300">{exposure.email_checked}</span></div>
              )}
            </div>
          </div>

          {/* Security Incidents */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Security incidents & advisories:</span>
              <span className="text-xs font-mono font-bold text-blue-400">
                {hasBreaches ? '✓ Publicly reported incident' : '✓ No active incidents'}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 pl-3 border-l border-white/[0.08] space-y-0.5">
              <div>└── Source: <span className="text-blue-300">NVD / CVE Disclosures / Public Domain Registries</span></div>
              {exposure.domain_checked && (
                <div>└── Domain Scope: <span className="text-slate-300">{exposure.domain_checked}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Breach Items List (Collapsible / Expandable) */}
        {hasBreaches && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Correlated Public Incident Records:
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium transition-colors"
              >
                <span>{expanded ? 'Hide Incident Details' : `Show ${exposure.items.length} Incident Records`}</span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {exposure.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/20 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white font-sans">{item.source}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {item.impact_level} IMPACT
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">{item.reported_date}</span>
                        </div>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">{item.description}</p>
                      {item.advisory_url && (
                        <a
                          href={item.advisory_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-mono"
                        >
                          <span>Public Advisory Notice</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Strict Regulatory Credentials Compliance Notice */}
        <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 flex items-start gap-3">
          <div className="p-1 rounded bg-red-500/20 text-red-400 flex-shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-bold text-red-300 font-mono flex items-center gap-2">
              <span>Credentials: DO NOT display passwords or leaked credentials</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              APORIA TRACE does not collect, index, or display stolen passwords, private credentials, or illegally obtained databases.
              Only legitimate breach notification registries and public security disclosures are cited for defensive awareness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
