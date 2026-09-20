import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvestigationResult } from '../../types/intelligence';
import { X, Printer, Shield, ChevronRight, ExternalLink } from 'lucide-react';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: InvestigationResult;
}

export const DossierModal: React.FC<DossierModalProps> = ({ isOpen, onClose, result }) => {
  const handlePrint = () => window.print();

  // Collect all unique source URLs for provenance appendix
  const allSourceUrls = useMemo(() => {
    const urls = new Set<string>();
    result.profiles.forEach((p) => { if (p.profile_url) urls.add(p.profile_url); });
    result.activities.forEach((a) => { if (a.source_url) urls.add(a.source_url); });
    result.claims.forEach((c) => c.sources.filter(Boolean).forEach((s) => urls.add(s)));
    return Array.from(urls);
  }, [result]);

  const sections = [
    'Executive Verdict',
    'Seed Context',
    'Signal Breakdown',
    'Public Accounts',
    'Activity Timeline',
    result.conflicts.length > 0 ? 'Conflicts & Uncertainty' : null,
    'CESV Claims',
    'Provenance Appendix',
    'Methodology',
  ].filter(Boolean) as string[];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 no-print">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="w-full max-w-3xl my-8 rounded-2xl bg-[#0d1527] border border-cyan-900/40 overflow-hidden shadow-depth-4"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800 bg-[#090e1c] no-print sticky top-0 z-10">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs uppercase">
                <Shield className="w-4 h-4" />
                Executive Intelligence Dossier
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700 text-emerald-300 text-xs font-mono hover:bg-emerald-900/70 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <article id="dossier-print" className="p-8 text-slate-200 print:bg-white print:text-black">
              {/* Classification Header */}
              <header className="border-b border-slate-700 pb-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-mono text-cyan-400 tracking-[0.3em]">
                    APORIA TRACE // CLASSIFIED // PUBLIC SOURCE INTELLIGENCE REPORT
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    {new Date().toISOString().split('T')[0]}
                  </p>
                </div>
                <h1 className="text-2xl font-extrabold">{result.likely_identity}</h1>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Investigation {result.investigation_id} · Confidence {result.overall_confidence}% · Visual match{' '}
                  {Math.round(result.visual_similarity_score * 100)}%
                </p>
              </header>

              {/* Table of Contents */}
              <nav className="mb-6 p-4 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                <h2 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">Table of Contents</h2>
                <ol className="space-y-1">
                  {sections.map((s, i) => (
                    <li key={s} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-[10px] font-mono text-slate-500 w-4">{i + 1}.</span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      {s}
                    </li>
                  ))}
                </ol>
              </nav>

              {/* 1. Executive Verdict */}
              <section className="mb-6">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">1. Executive Verdict</h2>
                <p className="text-sm leading-relaxed">{result.summary_verdict}</p>
              </section>

              {/* 2. Seed Context */}
              <section className="mb-6">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">2. Seed Context (Consented)</h2>
                <ul className="text-xs font-mono space-y-1 text-slate-300">
                  <li>Name: {result.target_summary.name || '—'}</li>
                  <li>Handle: {result.target_summary.seed_handle || '—'}</li>
                  <li>Affiliation: {result.target_summary.affiliation || '—'}</li>
                  <li>Location: {result.target_summary.location || '—'}</li>
                  <li>Consent: <span className={result.target_summary.consent_confirmed ? 'text-emerald-400' : 'text-rose-400'}>{result.target_summary.consent_confirmed ? 'CONFIRMED' : 'MISSING'}</span></li>
                </ul>
              </section>

              {/* 3. Signal Breakdown */}
              <section className="mb-6">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">3. Signal Breakdown</h2>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-1.5 text-left text-slate-500 font-normal">Signal</th>
                      <th className="py-1.5 text-right text-slate-500 font-normal">Score</th>
                      <th className="py-1.5 text-right text-slate-500 font-normal">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.confidence_breakdown).map(([k, v]) => (
                      <tr key={k} className="border-b border-slate-800">
                        <td className="py-1.5 pr-3 text-slate-300">{k}</td>
                        <td className="py-1.5 text-right text-white">{v}%</td>
                        <td className={`py-1.5 text-right ${v >= 80 ? 'text-emerald-400' : v >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {v >= 80 ? 'Strong' : v >= 60 ? 'Partial' : 'Weak'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* 4. Public Accounts */}
              <section className="mb-6">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
                  4. Public Accounts ({result.profiles.length})
                </h2>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-1.5 text-left text-slate-500 font-normal">Platform</th>
                      <th className="py-1.5 text-left text-slate-500 font-normal">Username</th>
                      <th className="py-1.5 text-right text-slate-500 font-normal">Evidence</th>
                      <th className="py-1.5 text-right text-slate-500 font-normal">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.profiles.map((p) => (
                      <tr key={`${p.platform}-${p.username}`} className="border-b border-slate-800">
                        <td className="py-1.5 text-slate-300">{p.platform}</td>
                        <td className="py-1.5 text-cyan-300">@{p.username}</td>
                        <td className="py-1.5 text-right text-white">{Math.round(p.evidence_score * 100)}%</td>
                        <td className={`py-1.5 text-right ${p.verified_link ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {p.verified_link ? '✓' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* 5. Activity Timeline */}
              <section className="mb-6">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
                  5. Activity Timeline ({result.timeline.length})
                </h2>
                <ul className="text-xs space-y-1.5">
                  {result.timeline.map((a) => (
                    <li key={a.id}>
                      <span className="font-mono text-slate-500">{a.date}</span> · <span className="text-slate-400">{a.category}:</span> {a.title}
                    </li>
                  ))}
                </ul>
              </section>

              {/* 6. Conflicts */}
              {result.conflicts.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-2">
                    6. Conflicts & Uncertainty
                  </h2>
                  {result.conflicts.map((c) => (
                    <div key={c.id} className="text-xs mb-3 p-3 rounded border border-amber-800/50">
                      <p className="font-semibold">{c.field}: {c.explanation}</p>
                      <p className="mt-1 text-slate-400">{c.source_a}: <span className="text-white">{c.value_a}</span> vs {c.source_b}: <span className="text-white">{c.value_b}</span></p>
                      <p className="mt-1 text-blue-300 text-[11px]">Reconciliation: {c.reconciliation_suggestion}</p>
                    </div>
                  ))}
                </section>
              )}

              {/* 7. CESV Claims */}
              <section className="mb-6">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
                  {result.conflicts.length > 0 ? '7' : '6'}. CESV Claims
                </h2>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-1.5 text-left text-slate-500 font-normal">ID</th>
                      <th className="py-1.5 text-left text-slate-500 font-normal">Status</th>
                      <th className="py-1.5 text-left text-slate-500 font-normal">Claim</th>
                      <th className="py-1.5 text-right text-slate-500 font-normal">Conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.claims.map((c) => (
                      <tr key={c.claim_id} className="border-b border-slate-800">
                        <td className="py-1.5 text-slate-500 text-[10px]">{c.claim_id}</td>
                        <td className={`py-1.5 ${
                          c.status === 'CONFIRMED' ? 'text-emerald-400' :
                          c.status === 'CONFLICT' ? 'text-rose-400' :
                          c.status === 'UNRESOLVED' ? 'text-amber-400' : 'text-cyan-400'
                        }`}>
                          {c.status}
                        </td>
                        <td className="py-1.5 text-slate-300 max-w-xs truncate">{c.claim_text}</td>
                        <td className="py-1.5 text-right text-white">{c.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* 8. Provenance Appendix */}
              <section className="mb-6">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
                  {result.conflicts.length > 0 ? '8' : '7'}. Provenance Appendix
                </h2>
                <p className="text-[11px] text-slate-500 mb-2">
                  All unique source URLs cited across profiles, activities, and claims.
                </p>
                <ul className="text-[11px] font-mono space-y-1 text-slate-400">
                  {allSourceUrls.map((url, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3 text-cyan-500/60 flex-shrink-0" />
                      <span className="truncate">{url}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 9. Methodology Note */}
              <section className="mb-6">
                <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
                  {result.conflicts.length > 0 ? '9' : '8'}. Confidence Methodology
                </h2>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Confidence scores are computed using a Bayesian weighted attribution model (v3.0). Each evidence signal is independently scored based on source reliability, cross-link verification depth, and corroboration breadth. Conflict penalties reduce the overall score proportionally to anomaly severity. Visual biometric matching uses deterministic prototype vectors and should not be treated as identity proof. All inferred identity is probabilistic and never treated as certain.
                </p>
              </section>

              {/* Classification Footer */}
              <footer className="mt-8 pt-4 border-t border-slate-700 flex items-center justify-between">
                <div className="text-[10px] font-mono text-slate-500">
                  Generated by APORIA TRACE 3.0 · Public sources only · Inferred identity is not treated as certain.
                </div>
                <div className="text-[10px] font-mono text-slate-600">
                  Page 1 of 1
                </div>
              </footer>
            </article>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
