import React from 'react';
import { Terminal, Code2, Layers, Database, Sparkles, CheckCircle2, Globe, Cpu } from 'lucide-react';

interface DeveloperFingerprintCardProps {
  fingerprint?: {
    languages?: string[];
    frameworks?: string[];
    databases?: string[];
    focus_areas?: string[];
    summary?: string;
  };
}

export const DeveloperFingerprintCard: React.FC<DeveloperFingerprintCardProps> = ({
  fingerprint
}) => {
  if (!fingerprint) {
    return null;
  }

  const {
    languages = [],
    frameworks = [],
    databases = [],
    focus_areas = [],
    summary = ''
  } = fingerprint;

  if (languages.length === 0 && frameworks.length === 0 && focus_areas.length === 0) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[#080d19] overflow-hidden shadow-xl relative">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-96 h-32 bg-blue-600/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-white/[0.06] bg-[#060a13] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white font-sans tracking-tight">
                DEVELOPER FINGERPRINT
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-mono font-medium">
                AI / STATIC RECON
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Synthesized public engineering footprint, algorithmic specialties, and technology stack.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-white/[0.05]">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Cross-Platform Public Evidence</span>
        </div>
      </div>

      {/* Body: Stacks Grid */}
      <div className="p-5 space-y-5">
        {/* Natural Language Summary */}
        {summary && (
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-slate-200 text-xs leading-relaxed font-sans flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Synthesized Persona Profile: </span>
              <span className="text-slate-300">{summary}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Languages */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.05] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400">
              <Code2 className="w-4 h-4" />
              <span>LANGUAGES</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {languages.length > 0 ? (
                languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono font-medium"
                  >
                    {lang}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-mono">No explicit public languages</span>
              )}
            </div>
          </div>

          {/* Frameworks & Libraries */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.05] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-blue-400">
              <Layers className="w-4 h-4" />
              <span>FRAMEWORKS & LIBS</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {frameworks.length > 0 ? (
                frameworks.map((fw, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-mono font-medium"
                  >
                    {fw}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-mono">No explicit public frameworks</span>
              )}
            </div>
          </div>

          {/* Databases & Storage */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.05] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400">
              <Database className="w-4 h-4" />
              <span>DATABASES</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {databases.length > 0 ? (
                databases.map((db, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-medium"
                  >
                    {db}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-mono">Standard File / Cloud DB</span>
              )}
            </div>
          </div>

          {/* Focus Areas & Domains */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.05] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-purple-400">
              <Globe className="w-4 h-4" />
              <span>DOMAINS & SPECIALTIES</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {focus_areas.length > 0 ? (
                focus_areas.map((area, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-sans font-medium"
                  >
                    {area}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-mono">Generalist Software Engineering</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
