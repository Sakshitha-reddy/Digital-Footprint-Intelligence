import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, ExternalLink, Shield, Copy, CheckCheck } from 'lucide-react';
import { apiService } from '../../services/api';
import { CopilotResponse } from '../../types/intelligence';
import { ConfidenceGauge } from '../shared/ConfidenceGauge';

interface RagChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
}

const QUICK_PROMPTS = [
  'Summarize all resolved profiles',
  'List repositories and projects',
  'Which hackathons or events appear?',
  'Are there conflicts or contradictions?',
  'Summarize publications',
  'Map all correlated aliases',
];

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  citations?: CopilotResponse['citations'];
  confidence?: number;
}

export const RagChatDrawer: React.FC<RagChatDrawerProps> = ({
  isOpen,
  onClose,
  investigationId,
}) => {
  const [query, setQuery] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, loading]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setQuery('');
    setTurns((t) => [...t, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await apiService.queryCopilot(investigationId, q);
      setTurns((t) => [
        ...t,
        { role: 'assistant', text: res.answer, citations: res.citations, confidence: res.confidence },
      ]);
    } catch {
      setTurns((t) => [
        ...t,
        { role: 'assistant', text: 'Copilot unavailable. Confirm the backend is running on port 8000.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 no-print"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-[#0d1527] border-l border-cyan-900/40 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.5)] no-print"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Evidence-Grounded Copilot</div>
                  <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    Scoped to {investigationId.slice(0, 8)}…
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompts — context-aware */}
            <div className="px-4 py-2.5 border-b border-white/[0.04] flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => ask(p)}
                  className="text-[10px] font-mono px-2 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-600 hover:text-cyan-300 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {turns.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <Sparkles className="w-6 h-6 text-blue-400/60" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[260px]">
                    Ask about retrieved public evidence. All answers are grounded in sources from this investigation — the model is not the source of truth.
                  </p>
                </div>
              )}
              {turns.map((t, i) => (
                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-xl px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      t.role === 'user'
                        ? 'bg-cyan-950/80 border border-cyan-800/60 text-cyan-100'
                        : 'bg-slate-900 border border-slate-700/60 text-slate-200'
                    }`}
                  >
                    {t.text}
                    {t.role === 'assistant' && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
                        <div className="flex flex-wrap gap-1">
                          {t.citations?.map((c, j) => (
                            <a
                              key={j}
                              href={c.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {c.platform}
                            </a>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {t.confidence != null && (
                            <ConfidenceGauge value={t.confidence} size="xs" showLabel={false} />
                          )}
                          <button
                            onClick={() => copyResponse(i, t.text)}
                            className="text-slate-500 hover:text-cyan-400 transition-colors"
                          >
                            {copiedIdx === i ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                      Retrieving cited evidence…
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(query);
              }}
              className="p-3 border-t border-slate-800 flex gap-2"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about profiles, conflicts, projects…"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-500 font-mono placeholder-slate-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
