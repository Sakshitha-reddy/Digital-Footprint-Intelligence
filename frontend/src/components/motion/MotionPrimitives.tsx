import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';

// Respect prefers-reduced-motion
const shouldReduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Standard enterprise motion curve (Apple / Linear style: fast-out, soft-settle)
export const ENTERPRISE_TRANSITION: Transition = {
  duration: shouldReduceMotion ? 0 : 0.28,
  ease: [0.16, 1, 0.3, 1], // Custom smooth cubic-bezier
};

export const MICRO_TRANSITION: Transition = {
  duration: shouldReduceMotion ? 0 : 0.16,
  ease: 'easeOut',
};

// ============================================================================
// 1. ANIMATED TEXT — Transitions smoothly when content changes
// ============================================================================
interface AnimatedTextProps {
  text: string;
  className?: string;
  subtext?: string;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = '',
  subtext,
}) => {
  return (
    <div className={`relative overflow-hidden inline-block ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={text}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={ENTERPRISE_TRANSITION}
          className="inline-block"
        >
          {text}
          {subtext && (
            <span className="block text-slate-400 text-xs font-normal mt-0.5 font-sans">
              {subtext}
            </span>
          )}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// 2. PAGE / WORKSPACE TRANSITION — Content subtly fades and moves upward
// ============================================================================
interface PageTransitionProps {
  children: React.ReactNode;
  viewKey: string;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  viewKey,
  className = '',
}) => {
  return (
    <motion.div
      key={viewKey}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.26,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// 3. ANIMATED NUMBER — Smooth numeric counter transition
// ============================================================================
interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  suffix = '',
  prefix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    let start = displayValue;
    const end = value;
    if (start === end) return;

    const startTime = performance.now();
    const duration = 350; // 350ms smooth transition

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  return (
    <span className={`inline-flex items-center font-mono ${className}`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

// ============================================================================
// 4. ANIMATED STEP — Investigation sequence progressive disclosure
// ============================================================================
interface AnimatedStepProps {
  stepNumber: string;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
}

export const AnimatedStep: React.FC<AnimatedStepProps> = ({
  stepNumber,
  title,
  description,
  isActive,
  isCompleted,
}) => {
  return (
    <motion.div
      animate={{
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.08)' : 'rgba(15, 23, 42, 0.4)',
        borderColor: isActive ? 'rgba(59, 130, 246, 0.35)' : isCompleted ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
      }}
      transition={MICRO_TRANSITION}
      className="p-3.5 rounded-xl border flex items-start gap-3 transition-colors"
    >
      <div
        className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : isCompleted
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-slate-900 text-slate-500 border border-white/[0.04]'
        }`}
      >
        {isCompleted ? '✓' : stepNumber}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold font-sans ${isActive ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
            {title}
          </span>
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 truncate leading-normal">
          {description}
        </p>
      </div>
    </motion.div>
  );
};
