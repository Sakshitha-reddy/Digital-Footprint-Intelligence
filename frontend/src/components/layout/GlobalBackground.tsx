import React from 'react';
import { User, Mail, FileText, Globe } from 'lucide-react';

interface GlobalBackgroundProps {
  showNodes?: boolean;
}

export const GlobalBackground: React.FC<GlobalBackgroundProps> = ({ showNodes = true }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Base Earth & Network Connection Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: `url('/assets/aporia-bg-new.jpg')` }}
      />

      {/* 2. Deep Intelligence Navy Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/70 via-[#071120]/50 to-[#030712]/80 backdrop-saturate-125" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-black/60" />

      {/* 3. Floating Network Node Indicators (matching reference mockup) */}
      {showNodes && (
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          {/* Social Profiles Pill (Top Right) */}
          <div className="absolute top-[18%] right-[18%] flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#091326]/60 backdrop-blur-md border border-indigo-400/30 text-xs font-sans text-slate-200 shadow-lg shadow-indigo-950/40 animate-pulse">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium tracking-wide">Social Profiles</span>
          </div>

          {/* GitHub Pill (Middle-Right near Earth curve) */}
          <div className="absolute top-[32%] right-[32%] flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#091326]/75 backdrop-blur-md border border-cyan-400/40 text-xs font-sans text-white shadow-xl shadow-cyan-950/50">
            <svg className="w-3.5 h-3.5 text-cyan-400 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="font-semibold tracking-wide">GitHub</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          {/* Emails Pill (Mid-Right) */}
          <div className="absolute top-[44%] right-[12%] flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#091326]/60 backdrop-blur-md border border-blue-400/30 text-xs font-sans text-slate-200 shadow-lg shadow-blue-950/40">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium tracking-wide">Emails</span>
          </div>

          {/* Public Records Pill (Lower-Center Right) */}
          <div className="absolute bottom-[36%] right-[28%] flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#091326]/60 backdrop-blur-md border border-emerald-400/30 text-xs font-sans text-slate-200 shadow-lg shadow-emerald-950/40">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium tracking-wide">Public Records</span>
          </div>

          {/* Web Presence Pill (Bottom Right) */}
          <div className="absolute bottom-[24%] right-[14%] flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#091326]/60 backdrop-blur-md border border-sky-400/30 text-xs font-sans text-slate-200 shadow-lg shadow-sky-950/40">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium tracking-wide">Web Presence</span>
          </div>
        </div>
      )}
    </div>
  );
};
