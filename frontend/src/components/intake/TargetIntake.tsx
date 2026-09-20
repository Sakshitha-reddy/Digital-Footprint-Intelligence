import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TargetInput, BenchmarkItem } from '../../types/intelligence';
import { PhotoUploadDropzone } from './PhotoUploadDropzone';
import {
  UserCheck,
  Building2,
  MapPin,
  AtSign,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Tag,
  FileText,
  Play,
  ExternalLink,
  Search,
  Network,
  Lock,
} from 'lucide-react';

import { UserSession } from '../auth/AuthModal';

interface TargetIntakeProps {
  benchmarks: BenchmarkItem[];
  onSubmit: (input: TargetInput) => void;
  isLoading: boolean;
  currentUser?: UserSession | null;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
}

type IntakeStep = 1 | 2 | 3 | 4;

export const TargetIntake: React.FC<TargetIntakeProps> = ({
  benchmarks,
  onSubmit,
  isLoading,
  currentUser,
  onOpenAuth,
}) => {
  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<IntakeStep>(1);

  // Target Identity Fields
  const [name, setName] = useState('');
  const [seedHandle, setSeedHandle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  // Context Fields
  const [affiliation, setAffiliation] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [location, setLocation] = useState('');
  const [keywords, setKeywords] = useState('Cybersecurity, OSINT, Distributed Systems');
  const [notes, setNotes] = useState('');

  // Scope & Consent
  const [enabledSources, setEnabledSources] = useState({
    github: true,
    linkedin: true,
    devto: true,
    hackernews: true,
    youtube: true,
    web: true,
  });
  const [investigationDepth, setInvestigationDepth] = useState<'standard' | 'deep'>('deep');
  const [consentConfirmed, setConsentConfirmed] = useState(true);

  // Selected Benchmark
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('');

  const handleSelectBenchmark = (b: BenchmarkItem, autoSubmit = false) => {
    setSelectedBenchmark(b.id);
    setName(b.input.name || '');
    setSeedHandle(b.input.seed_handle || '');
    setAffiliation(b.input.affiliation || '');
    setLocation(b.input.location || '');
    setImageUrl(b.input.image_url || '');
    setPreviewUrl(b.input.image_url || null);
    setPhotoFile(null);

    if (autoSubmit) {
      onSubmit({
        name: b.input.name || '',
        seed_handle: b.input.seed_handle || '',
        email: b.input.email || '',
        affiliation: b.input.affiliation || '',
        location: b.input.location || '',
        image_url: b.input.image_url || '',
        consent_confirmed: true,
        benchmark_id: b.id,
        photo: null,
      });
    }
  };

  const handleFinalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!consentConfirmed) return;

    onSubmit({
      name: name.trim() || undefined,
      seed_handle: seedHandle.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      organization: affiliation.trim() || undefined,
      affiliation: affiliation.trim() || undefined,
      location: location.trim() || undefined,
      image_url: previewUrl || undefined,
      linkedin_url: linkedinUrl.trim() || undefined,
      keywords: keywords.trim() || undefined,
      consent_confirmed: consentConfirmed,
      benchmark_id: selectedBenchmark || undefined,
      photo: photoFile,
    });
  };

  const canProceedStep1 = Boolean(
    name.trim().length > 0 ||
    seedHandle.trim().length > 0 ||
    email.trim().length > 0 ||
    phone.trim().length > 0 ||
    photoFile !== null ||
    previewUrl !== null ||
    selectedBenchmark
  );
  const canProceedStep3 = consentConfirmed;

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-28 py-8 space-y-12 mx-auto">
      {/* ================================================================ */}
      {/* 1. APORIA TRACE CINEMATIC HERO                                     */}
      {/* ================================================================ */}
      <section className="relative pt-6 pb-6">
        <div className="space-y-7">
          {/* Animated pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0a1428]/60 backdrop-blur-md border border-cyan-400/30 text-cyan-300 text-[11px] font-mono tracking-widest font-bold uppercase"
          >
            <span>DISCOVER</span>
            <span className="text-cyan-500/50">•</span>
            <span>CORRELATE</span>
            <span className="text-cyan-500/50">•</span>
            <span>EXPLAIN</span>
            <span className="text-cyan-500/50">•</span>
            <span>PROTECT</span>
          </motion.div>

          {/* Main title with staggered animation */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight font-sans leading-[1.05]"
            >
              APORIA{' '}
              <span
                className="text-transparent bg-clip-text font-black"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #22d3ee 40%, #818cf8 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 4s ease-in-out infinite',
                }}
              >
                TRACE
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
              className="text-2xl sm:text-3xl font-bold text-slate-200 mt-3 font-sans tracking-wide"
            >
              From Clues to Clarity
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.9, ease: 'easeOut' }}
                className="block h-[3px] w-48 mt-2 rounded-full origin-left"
                style={{
                  background: 'linear-gradient(90deg, #3b82f6, #22d3ee, transparent)',
                }}
              />
            </motion.p>
          </div>

          {/* Description with fade-in + accent styling */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
            className="max-w-3xl relative"
          >
            <div className="pl-5 border-l-2 border-cyan-500/40">
              <p className="text-base sm:text-lg leading-[1.8] font-sans font-medium tracking-wide text-slate-400">
                Connect{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 font-semibold">
                  fragmented public signals
                </span>{' '}
                into{' '}
                <span className="text-slate-200 font-semibold">
                  evidence-grounded intelligence
                </span>{' '}
                across{' '}
                <span className="text-blue-300/90">developer profiles</span>,{' '}
                <span className="text-indigo-300/90">code registries</span>,{' '}
                <span className="text-purple-300/90">academic papers</span>, and{' '}
                <span className="text-cyan-300/90">social footprints</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2. MAIN TWO-COLUMN: WIZARD + BENCHMARKS PRESETS (FULL WIDTH)       */}
      {/* ================================================================ */}
      <div id="intake-wizard" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column: Progressive Disclosure 4-Step Intake Flow */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#091326]/50 backdrop-blur-2xl border border-slate-400/15 space-y-6 shadow-2xl">
            {/* Step Wizard Header */}
            <div className="border-b border-white/[0.06] pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold block mb-1">
                    Investigation Configuration Pipeline
                  </span>
                  <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                    {currentStep === 1 && 'Step 01: Target Identity & Photo Reference'}
                    {currentStep === 2 && 'Step 02: Contextual Affiliations & Scope'}
                    {currentStep === 3 && 'Step 03: Connectors & Authorization'}
                    {currentStep === 4 && 'Step 04: Pre-Flight Review & Launch'}
                  </h2>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                  <span className="text-white font-bold">0{currentStep}</span>
                  <span>/</span>
                  <span>04</span>
                </div>
              </div>

              {/* Progress Steps Indicators */}
              <div className="grid grid-cols-4 gap-2 mt-5">
                {[
                  { step: 1, label: 'Target' },
                  { step: 2, label: 'Context' },
                  { step: 3, label: 'Scope' },
                  { step: 4, label: 'Review' },
                ].map(({ step, label }) => {
                  const isCurrent = currentStep === step;
                  const isDone = currentStep > step;
                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => {
                        if (step <= currentStep || (step === 2 && canProceedStep1) || (step === 4 && canProceedStep3)) {
                          setCurrentStep(step as IntakeStep);
                        }
                      }}
                      className={`text-left p-2.5 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-blue-600/20 border-blue-500/50 text-white'
                          : isDone
                          ? 'bg-slate-900/70 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-950/40 border-white/[0.04] text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span>STEP 0{step}</span>
                        {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <div className="text-xs font-bold font-sans mt-0.5 truncate">{label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Body with Animated Transitions */}
            <AnimatePresence mode="wait">
              {/* ----------------- STEP 1: TARGET ----------------- */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="text-xs text-slate-400">
                    Define target seeds for multi-source OSINT resolution. Provide a full name, primary online alias, or upload a reference photo for facial vector correlation.
                  </div>

                  {/* Drag-and-Drop Photo Upload (NO Photo URL Requirement) */}
                  <PhotoUploadDropzone
                    onFileSelect={(file, dataUrl) => {
                      setPhotoFile(file);
                      setPreviewUrl(dataUrl);
                      setImageUrl(dataUrl || '');
                    }}
                    selectedFile={photoFile}
                    previewUrl={previewUrl}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                        Full / Primary Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Shiva Kumar"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <AtSign className="w-3.5 h-3.5 text-cyan-400" />
                        Seed Username / Handle
                      </label>
                      <input
                        type="text"
                        value={seedHandle}
                        onChange={(e) => setSeedHandle(e.target.value.replace(/^@/, ''))}
                        placeholder="e.g. shiva-sec"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-white text-xs placeholder:text-slate-600 font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          Target Email Address
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-800/60 px-1.5 py-0.5 rounded border border-white/[0.04]">
                          DISCOVERY SEED
                        </span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. john@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-white text-xs placeholder:text-slate-600 font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Seed only — evaluated with provenance, not presumed identical.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          Phone Number
                        </span>
                        <span className="text-[10px] text-amber-400/90 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          LAWFUL ONLY
                        </span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 019-2834"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-white text-xs placeholder:text-slate-600 font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Only where lawful and appropriate.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ----------------- STEP 2: CONTEXT ----------------- */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-5"
                >
                  <div className="text-xs text-slate-400">
                    Add organizational anchors and geographic context to calibrate the Bayesian correlation prior probability and disambiguate homonyms.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-400" />
                        Affiliated Organization / Institution
                      </label>
                      <input
                        type="text"
                        value={affiliation}
                        onChange={(e) => setAffiliation(e.target.value)}
                        placeholder="e.g. Apex Security Labs / Stanford"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        Geographic Jurisdiction / Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. San Francisco, CA / Bengaluru, IN"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        Personal Portfolio / Website Domain
                      </label>
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="e.g. https://portfolio.dev"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-white text-xs placeholder:text-slate-600 font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          Public LinkedIn Profile URL
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          USER ANCHOR
                        </span>
                      </label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="e.g. https://www.linkedin.com/in/username"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-white text-xs placeholder:text-slate-600 font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      Reconnaissance Keywords
                    </label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="e.g. Rust, LLM Security, OSINT, Distributed Systems"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Analyst Context Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special investigation scope remarks, homonym disambiguation notes..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-white/[0.08] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {/* ----------------- STEP 3: SCOPE & CONSENT ----------------- */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-5"
                >
                  <div className="text-xs text-slate-400">
                    Select target public API connectors and configure depth boundaries. All queries operate strictly within public, compliant OSINT endpoints.
                  </div>

                  {/* Sources Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Public Connectors & Signal Integrations
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'github', label: 'GitHub REST API', tag: 'Official REST API' },
                        { id: 'linkedin', label: 'LinkedIn (Public Discovery)', tag: 'Open Search Index' },
                        { id: 'devto', label: 'Dev.to Connector', tag: 'Articles & Bio' },
                        { id: 'hackernews', label: 'Algolia HackerNews', tag: 'Technical Submissions' },
                        { id: 'youtube', label: 'YouTube Search', tag: 'Talks & Media' },
                        { id: 'web', label: 'Web / DuckDuckGo', tag: 'Entity Knowledge Graph' },
                      ].map((source) => {
                        const isChecked = enabledSources[source.id as keyof typeof enabledSources];
                        return (
                          <div
                            key={source.id}
                            onClick={() =>
                              setEnabledSources((prev) => ({
                                ...prev,
                                [source.id]: !prev[source.id as keyof typeof enabledSources],
                              }))
                            }
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-blue-600/15 border-blue-500/40 text-white'
                                : 'bg-slate-950/50 border-white/[0.04] text-slate-500 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold">{source.label}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="rounded text-blue-500 focus:ring-0"
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                              {source.tag}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Investigation Depth */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Attribution Resolution Depth
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => setInvestigationDepth('standard')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          investigationDepth === 'standard'
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-slate-950/50 border-white/[0.04] text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-semibold text-xs">Standard Attribution</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Direct profile matching, fast response (&lt; 2s)
                        </div>
                      </div>

                      <div
                        onClick={() => setInvestigationDepth('deep')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          investigationDepth === 'deep'
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-slate-950/50 border-white/[0.04] text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <span>Multi-Hop Topology</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                            RECOMMENDED
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Full cross-link cycles, conflict verification & timeline
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legal Consent Checkbox */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="consent-check"
                        checked={consentConfirmed}
                        onChange={(e) => setConsentConfirmed(e.target.checked)}
                        className="mt-1 rounded bg-slate-900 border-emerald-500/50 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="consent-check" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                        <strong className="text-emerald-400 font-semibold block mb-0.5">
                          Mandatory Ethical OSINT Authorization
                        </strong>
                        I confirm this digital footprint investigation targets public, non-authenticated OSINT records or has been initiated with explicit consent under compliance guidelines.
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ----------------- STEP 4: REVIEW ----------------- */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-5"
                >
                  <div className="p-4 rounded-xl bg-[#090e1c] border border-blue-500/20 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
                        Pre-Flight Investigation Manifest
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Ready for Execution
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono block">Primary Target</span>
                        <strong className="text-white font-semibold">{name || 'Unspecified'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono block">Seed Alias</span>
                        <strong className="text-cyan-300 font-mono">@{seedHandle || 'unspecified'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono block">Target Email</span>
                        <strong className="text-amber-300 font-mono">{email || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono block">Phone</span>
                        <strong className="text-emerald-300 font-mono">{phone || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono block">Organization</span>
                        <strong className="text-slate-200">{affiliation || 'None provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono block">Website</span>
                        <strong className="text-blue-300 font-mono text-[11px] truncate block">{website || 'None provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono block">Photo Attached</span>
                        <strong className="text-emerald-400">{photoFile ? `${photoFile.name} (Uploaded)` : (previewUrl ? 'Reference Set' : 'None')}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Enabled Public Connectors: GitHub, LinkedIn, Dev.to, HN, YouTube, Web</span>
                      <span>Depth: {investigationDepth.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.05] text-xs text-slate-400 space-y-1">
                    <div className="text-slate-300 font-medium">Pipeline Execution Sequence:</div>
                    <div className="font-mono text-[11px] text-slate-500">
                      1. Connectors Query ➔ 2. Signal Normalization ➔ 3. Persona Clustering ➔ 4. Bayesian Evidence Corroboration ➔ 5. Topology Graph Generation
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev - 1) as IntakeStep)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/[0.08] text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Step</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  disabled={currentStep === 1 && !canProceedStep1}
                  onClick={() => setCurrentStep((prev) => (prev + 1) as IntakeStep)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLoading || !consentConfirmed}
                  onClick={() => handleFinalSubmit()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Initializing Reconnaissance...</span>
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>START INVESTIGATION</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pre-configured Benchmark Scenarios */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="investigation-panel p-5 sm:p-6 rounded-2xl border border-white/[0.08] space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Benchmark Scenarios</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Pre-indexed datasets for instant evaluation</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                1-Click Run
              </span>
            </div>

            <div className="space-y-3">
              {benchmarks.map((b) => {
                const isSelected = selectedBenchmark === b.id;
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border transition-all text-left space-y-2.5 ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-slate-950/60 border-white/[0.05] hover:border-white/[0.12] hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white font-sans">{b.title}</h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          @{b.input.seed_handle} · {b.input.location}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                          b.confidence >= 80
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : b.confidence >= 60
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {b.confidence}% Score
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {b.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                      <button
                        type="button"
                        onClick={() => handleSelectBenchmark(b, false)}
                        className="text-[11px] text-slate-300 hover:text-white font-medium py-1 px-2.5 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors"
                      >
                        Load Into Wizard
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectBenchmark(b, true)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold py-1 px-3 rounded bg-cyan-950/60 border border-cyan-800/50 hover:border-cyan-700 transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run Scan</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Technical Architecture Reference */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-white/[0.04] space-y-2 text-[11px] text-slate-400 font-mono">
            <div className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              CESV Framework Pipeline
            </div>
            <div className="space-y-1">
              <div>• Claim: Candidate profile attribution</div>
              <div>• Evidence: Cross-platform public traces</div>
              <div>• Source: Independent origin endpoints</div>
              <div>• Verification: Bayesian weight + penalty</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. GLASS FEATURE PANELS (DISCOVER, CORRELATE, EXPLAIN, PROTECT)   */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="p-5 rounded-2xl bg-[#091326]/50 backdrop-blur-xl border border-slate-400/12 shadow-xl hover:bg-[#0c1a32]/70 hover:border-cyan-400/35 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <Search className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white font-sans mb-1">Discover</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Find relevant public information across the open web.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="p-5 rounded-2xl bg-[#091326]/50 backdrop-blur-xl border border-slate-400/12 shadow-xl hover:bg-[#0c1a32]/70 hover:border-blue-400/35 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <Network className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white font-sans mb-1">Correlate</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Connect the dots between identities, platforms and events.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="p-5 rounded-2xl bg-[#091326]/50 backdrop-blur-xl border border-slate-400/12 shadow-xl hover:bg-[#0c1a32]/70 hover:border-indigo-400/35 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white font-sans mb-1">Explain</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            See why each connection is suggested with evidence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="p-5 rounded-2xl bg-[#091326]/50 backdrop-blur-xl border border-slate-400/12 shadow-xl hover:bg-[#0c1a32]/70 hover:border-purple-400/35 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <Lock className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white font-sans mb-1">Protect</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Make informed decisions with clarity and responsibility.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
