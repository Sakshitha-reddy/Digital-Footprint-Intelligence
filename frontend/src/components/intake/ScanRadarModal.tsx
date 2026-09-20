import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Terminal, Check } from 'lucide-react';
import { AnimatedText, AnimatedStep, ENTERPRISE_TRANSITION } from '../motion/MotionPrimitives';

interface ScanRadarModalProps {
  isOpen: boolean;
}

interface PipelinePhase {
  step: string;
  title: string;
  description: string;
  durationMs: number;
}

const PHASES: PipelinePhase[] = [
  { step: '01', title: 'DISCOVER', description: 'Discovering public sources across GitHub, Dev.to & public indexes', durationMs: 450 },
  { step: '02', title: 'CORRELATE', description: 'Correlating candidate identities & bidirectional cross-links', durationMs: 450 },
  { step: '03', title: 'VERIFY', description: 'Evaluating supporting evidence & detecting conflicting claims', durationMs: 450 },
  { step: '04', title: 'EXPLAIN', description: 'Building intelligence relationship graph & chronological timeline', durationMs: 450 },
  { step: '05', title: 'READY', description: 'Investigation ready · Synthesizing Bayesian intelligence dossier', durationMs: 400 },
];

export const ScanRadarModal: React.FC<ScanRadarModalProps> = ({ isOpen }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIdx(0);
      return;
    }

    let isMounted = true;
    let idx = 0;

    const runSequence = async () => {
      for (let i = 0; i < PHASES.length; i++) {
        if (!isMounted) break;
        idx = i;
        setCurrentIdx(i);
        await new Promise((r) => setTimeout(r, PHASES[i].durationMs));
      }
    };

    runSequence();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPhase = PHASES[currentIdx] || PHASES[0];
  const progressPercent = Math.min(100, Math.round(((currentIdx + 1) / PHASES.length) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -8 }}
        transition={ENTERPRISE_TRANSITION}
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#070b14] p-6 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans tracking-tight">
                Investigation Pipeline
              </h3>
              <p className="text-[11px] font-mono text-slate-500">
                APORIA TRACE Execution Engine
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-blue-400">
              {progressPercent}%
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">
              Step 0{currentIdx + 1}/05
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ ease: 'easeOut', duration: 0.25 }}
          />
        </div>

        {/* Active Stage Animated Text (smooth fade + y transition) */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-white/[0.05] min-h-[72px] flex flex-col justify-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold mb-1 block">
            Current Stage
          </span>
          <AnimatedText
            text={currentPhase.title + ': ' + currentPhase.description}
            className="text-xs text-slate-200 font-medium leading-relaxed"
          />
        </div>

        {/* Pipeline Step Sequence */}
        <div className="space-y-2">
          {PHASES.map((p, idx) => (
            <AnimatedStep
              key={p.step}
              stepNumber={p.step}
              title={p.title}
              description={p.description}
              isActive={idx === currentIdx}
              isCompleted={idx < currentIdx}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
