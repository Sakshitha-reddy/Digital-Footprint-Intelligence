import React from 'react';
import { Shield, FileText, Sparkles, Command, RotateCcw, Copy, CheckCircle2, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { UserSession } from '../auth/AuthModal';

interface NavbarProps {
  hasResult: boolean;
  investigationId?: string;
  confidence?: number;
  currentUser?: UserSession | null;
  onOpenDossier: () => void;
  onOpenCopilot: () => void;
  onOpenCommandPalette: () => void;
  onReset: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasResult,
  investigationId,
  confidence,
  currentUser,
  onOpenDossier,
  onOpenCopilot,
  onOpenCommandPalette,
  onReset,
  onOpenAuth,
  onSignOut,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const copyId = () => {
    if (investigationId) {
      navigator.clipboard.writeText(investigationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-400/12 bg-[#071120]/50 backdrop-blur-2xl shadow-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 h-14 flex items-center justify-between">

        {/* Brand + Classification */}
        <div className="flex items-center gap-3.5 cursor-pointer group" onClick={onReset}>
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-600/20 border border-cyan-400/30 text-cyan-300 shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400/60 transition-all">
            <Shield className="w-4.5 h-4.5 text-cyan-400" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-white font-sans">APORIA <span className="text-cyan-400 font-normal">TRACE</span></span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                INTELLIGENCE
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block -mt-0.5 tracking-wider">From Clues to Clarity</span>
          </div>
        </div>

        {/* Center: Investigation ID + Status */}
        {hasResult && investigationId && (
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={copyId}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-600 text-xs font-mono text-slate-400 hover:text-slate-200 transition-all"
              title="Copy investigation ID"
            >
              {copied ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{investigationId.slice(0, 12)}…</span>
            </button>

            {confidence != null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
                <div
                  className={`w-2 h-2 rounded-full ${
                    confidence >= 80 ? 'bg-emerald-400' : confidence >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                />
                <span className={
                  confidence >= 80 ? 'text-emerald-400' : confidence >= 60 ? 'text-amber-400' : 'text-rose-400'
                }>
                  {confidence}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white text-xs font-medium transition-all"
            title="Command Palette (⌘K)"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <span className="command-bar-kbd text-[9px] hidden sm:inline">⌘K</span>
          </button>

          {hasResult && (
            <>
              <button
                onClick={onOpenCopilot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-medium transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Copilot</span>
              </button>

              <button
                onClick={onOpenDossier}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-white text-xs font-medium transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-slate-300" />
                <span>Dossier</span>
              </button>
            </>
          )}

          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
            title="New Investigation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Authentication Status */}
          <div className="relative ml-1">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 transition-all text-left"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-[11px] font-medium text-slate-200 leading-tight max-w-[120px] truncate">
                      {currentUser.fullName}
                    </p>
                    <p className="text-[9px] font-mono text-cyan-400 leading-none">
                      {currentUser.clearance.split(' - ')[0]}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="p-2 border-b border-slate-800/80 mb-1">
                      <p className="text-xs font-semibold text-white truncate">{currentUser.fullName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {currentUser.role}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenAuth('signin')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span>Switch Workspace / Account</span>
                    </button>

                    <button
                      onClick={onSignOut}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-medium transition-all shadow-sm"
                >
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
