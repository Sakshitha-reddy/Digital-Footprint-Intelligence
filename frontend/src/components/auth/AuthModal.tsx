import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Compass,
  GitMerge,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { authApi, UserSession, AuthConfig } from '../../services/authApi';

export type { UserSession };

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot';
  onSuccess: (user: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    google_enabled: false,
    github_enabled: false,
  });

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Create Account Form State
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // UI Interactive States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusState, setStatusState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check prefers-reduced-motion
  const shouldReduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Load OAuth configuration on mount
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setForgotSuccess(null);
      setStatusState('idle');
      authApi.getAuthConfig().then(setAuthConfig);
    }
  }, [isOpen, initialMode]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = signInEmail.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setStatusState('loading');
    try {
      const res = await authApi.login(cleanEmail, signInPassword);
      setStatusState('success');
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 500);
    } catch (err: any) {
      setStatusState('error');
      setErrorMessage(err?.message || 'Invalid email or password.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = signUpFullName.trim();
    const cleanEmail = signUpEmail.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid operational or organization email address.');
      return;
    }
    if (signUpPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters for cryptographic compliance.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setStatusState('loading');
    try {
      const res = await authApi.register(cleanName, cleanEmail, signUpPassword);
      setStatusState('success');
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 500);
    } catch (err: any) {
      setStatusState('error');
      setErrorMessage(err?.message || 'Failed to create account.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setForgotSuccess(null);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setStatusState('loading');
    try {
      const res = await authApi.requestPasswordReset(cleanEmail);
      setStatusState('idle');
      setForgotSuccess(res.message || 'Password recovery instructions have been initiated.');
    } catch (err: any) {
      setStatusState('error');
      setErrorMessage(err?.message || 'Failed to request password reset.');
    }
  };

  const handleGoogleSignIn = () => {
    setErrorMessage(null);
    if (!authConfig.google_enabled) {
      setErrorMessage(
        'Google OAuth is not configured on this deployment. Please sign in using your email and password.'
      );
      return;
    }
    // Real Google OAuth redirect if configured
    window.location.href = `/api/v1/auth/google`;
  };

  const handleGitHubSignIn = () => {
    setErrorMessage(null);
    if (!authConfig.github_enabled) {
      setErrorMessage(
        'GitHub OAuth is not configured on this deployment. Please sign in using your email and password.'
      );
      return;
    }
    // Real GitHub OAuth redirect if configured
    window.location.href = `/api/v1/auth/github/authorize`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-[#030712]/40 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-heading"
    >
      {/* Subtle Ambient Radial Lighting */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(59, 130, 246, 0.15), transparent 70%)'
        }}
      />

      {/* Main Workspace Authentication Container */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl rounded-2xl bg-[#091326]/65 backdrop-blur-2xl border border-slate-400/20 shadow-2xl shadow-black/90 overflow-hidden my-auto flex flex-col md:flex-row min-h-[580px]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all z-20 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ================================================================== */}
        {/* LEFT COLUMN: ENTERPRISE BRAND & CORE INTELLIGENCE PRINCIPLES (45%)  */}
        {/* ================================================================== */}
        <div 
          className="hidden md:flex md:w-[45%] lg:w-[44%] flex-col justify-between p-8 lg:p-10 border-r border-slate-400/15 relative overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `url('/assets/aporia-bg-new.jpg')` }}
        >
          {/* Subtle background overlay to keep text readable over the image */}
          <div className="absolute inset-0 bg-[#091326]/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/20 to-[#030712]/80" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none mix-blend-overlay" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

          {/* Brand Header */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-base font-bold text-white tracking-wide font-sans">
                APORIA TRACE
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-mono tracking-[0.2em] text-cyan-400 uppercase font-semibold">
                PUBLIC PROFILE &amp; DIGITAL FOOTPRINT INTELLIGENCE
              </p>
              <h2 className="text-xl lg:text-2xl font-semibold text-slate-100 font-sans tracking-tight">
                Discover. Correlate. Verify. Explain.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans pt-1">
                Turn fragmented public signals into evidence-grounded intelligence.
              </p>
            </div>

            <div className="w-full h-[1px] bg-slate-800/60 my-4" />

            {/* 3 Core Principles */}
            <div className="space-y-4 pt-1">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 font-mono">DISCOVER</h4>
                  <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                    Identify relevant public sources and consented digital footprints.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <GitMerge className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 font-mono">CORRELATE</h4>
                  <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                    Connect signals across identities and platforms.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 font-mono">VERIFY</h4>
                  <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                    Understand the evidence behind every connection.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Panel Footer */}
          <div className="relative z-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Enterprise OSINT Suite</span>
            <span className="text-slate-600">v3.0</span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT COLUMN: AUTHENTICATION INTERACTION PANEL (55%)               */}
        {/* ================================================================== */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-[#091326]/50 backdrop-blur-xl relative">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Mobile Header (Brand presence on smaller screens) */}
            <div className="md:hidden flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-sm font-bold text-white tracking-wide font-sans">
                APORIA TRACE
              </span>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </motion.div>
            )}

            {/* Forgot Password Success Display */}
            {forgotSuccess && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{forgotSuccess}</span>
              </motion.div>
            )}

            {/* =============================================================== */}
            {/* 1. SIGN IN MODE                                                 */}
            {/* =============================================================== */}
            {mode === 'signin' && (
              <div className="space-y-6">
                <div>
                  <h1 
                    id="auth-heading" 
                    className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight"
                  >
                    Welcome back
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
                    Sign in to your intelligence workspace.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="signin-email" 
                      className="block text-xs sm:text-[13px] font-medium text-slate-200"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <input
                        id="signin-email"
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        disabled={statusState === 'loading' || statusState === 'success'}
                        className="w-full h-12 px-3.5 rounded-xl bg-[#0b1220] border border-slate-700/40 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label 
                        htmlFor="signin-password" 
                        className="block text-xs sm:text-[13px] font-medium text-slate-200"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setForgotSuccess(null);
                          setMode('forgot');
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        disabled={statusState === 'loading' || statusState === 'success'}
                        className="w-full h-12 pl-3.5 pr-11 rounded-xl bg-[#0b1220] border border-slate-700/40 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="submit"
                    disabled={statusState === 'loading' || statusState === 'success'}
                    className="w-full h-12 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {statusState === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Signing in...</span>
                      </>
                    ) : statusState === 'success' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Authenticated</span>
                      </>
                    ) : (
                      <>
                        <span>Sign in</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-full border-t border-slate-800" />
                  <span className="absolute px-3 bg-[#070b14] text-[11px] font-mono text-slate-500 uppercase">
                    OR
                  </span>
                </div>

                {/* OAuth Provider Section */}
                <div className="space-y-2.5">
                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full h-11 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs sm:text-[13px] font-medium flex items-center justify-center gap-2.5 transition-all focus:outline-none focus:ring-1 focus:ring-slate-700"
                  >
                    {/* Neutral Google Icon */}
                    <svg className="w-4 h-4 fill-current text-slate-300" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V14.4h6.887C18.2 16.8 15.64 18.5 12.24 18.5c-3.6 0-6.5-2.9-6.5-6.5s2.9-6.5 6.5-6.5c1.6 0 3.05.6 4.18 1.6l3.07-3.07C17.5 2.1 15.02 1.1 12.24 1.1 6.22 1.1 1.34 5.98 1.34 12s4.88 10.9 10.9 10.9c6.3 0 10.47-4.43 10.47-10.66 0-.72-.07-1.42-.2-1.955H12.24z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* GitHub OAuth Button (RENDERED ONLY IF CONFIGURED) */}
                  {authConfig.github_enabled && (
                    <button
                      type="button"
                      onClick={handleGitHubSignIn}
                      className="w-full h-11 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs sm:text-[13px] font-medium flex items-center justify-center gap-2.5 transition-all focus:outline-none focus:ring-1 focus:ring-slate-700"
                    >
                      <svg className="w-4 h-4 fill-current text-slate-300" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      <span>Continue with GitHub</span>
                    </button>
                  )}
                </div>

                {/* Switch to Signup */}
                <div className="pt-2 text-center text-xs text-slate-400">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('signup');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors focus:outline-none"
                  >
                    Create account
                  </button>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 2. SIGN UP MODE                                                 */}
            {/* =============================================================== */}
            {mode === 'signup' && (
              <div className="space-y-5">
                <div>
                  <h1 
                    id="auth-heading" 
                    className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight"
                  >
                    Create account
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
                    Initialize your intelligence credentials and workspace.
                  </p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-3.5">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label 
                      htmlFor="signup-name" 
                      className="block text-xs font-medium text-slate-200"
                    >
                      Full name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      value={signUpFullName}
                      onChange={(e) => setSignUpFullName(e.target.value)}
                      placeholder="e.g. Sarah Connor"
                      autoComplete="name"
                      required
                      disabled={statusState === 'loading' || statusState === 'success'}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0b1220] border border-slate-700/40 text-white text-xs sm:text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label 
                      htmlFor="signup-email" 
                      className="block text-xs font-medium text-slate-200"
                    >
                      Work / Operational email
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="you@agency.org"
                      autoComplete="email"
                      required
                      disabled={statusState === 'loading' || statusState === 'success'}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0b1220] border border-slate-700/40 text-white text-xs sm:text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label 
                      htmlFor="signup-password" 
                      className="block text-xs font-medium text-slate-200"
                    >
                      Password (min. 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create strong password"
                        autoComplete="new-password"
                        required
                        disabled={statusState === 'loading' || statusState === 'success'}
                        className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-[#0b1220] border border-slate-700/40 text-white text-xs sm:text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label 
                      htmlFor="signup-confirm" 
                      className="block text-xs font-medium text-slate-200"
                    >
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        required
                        disabled={statusState === 'loading' || statusState === 'success'}
                        className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-[#0b1220] border border-slate-700/40 text-white text-xs sm:text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={statusState === 'loading' || statusState === 'success'}
                    className="w-full h-12 mt-1 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {statusState === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Creating account...</span>
                      </>
                    ) : statusState === 'success' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Account Created</span>
                      </>
                    ) : (
                      <>
                        <span>Create account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Switch to Sign In */}
                <div className="pt-2 text-center text-xs text-slate-400">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('signin');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors focus:outline-none"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 3. FORGOT PASSWORD MODE                                         */}
            {/* =============================================================== */}
            {mode === 'forgot' && (
              <div className="space-y-5">
                <div>
                  <h1 
                    id="auth-heading" 
                    className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight"
                  >
                    Reset your password
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
                    Enter your registered email address to receive password recovery instructions.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="forgot-email" 
                      className="block text-xs font-medium text-slate-200"
                    >
                      Email address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      disabled={statusState === 'loading'}
                      className="w-full h-12 px-3.5 rounded-xl bg-[#0b1220] border border-slate-700/40 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={statusState === 'loading'}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {statusState === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending recovery instructions...</span>
                      </>
                    ) : (
                      <>
                        <span>Send recovery link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 text-center text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setForgotSuccess(null);
                      setMode('signin');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors focus:outline-none"
                  >
                    ← Back to sign in
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Statement */}
          <div className="pt-6 border-t border-slate-800/80 mt-6 text-center">
            <p className="text-[11px] font-mono text-slate-500">
              Discover. Correlate. Verify. Explain.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
