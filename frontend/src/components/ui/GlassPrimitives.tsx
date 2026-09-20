import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'medium' | 'strong' | 'solid';
  className?: string;
  children: React.ReactNode;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  variant = 'medium',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    light: 'bg-[#071124]/35 backdrop-blur-md border-white/10 shadow-lg',
    medium: 'bg-[#091326]/55 backdrop-blur-xl border-slate-400/15 shadow-xl',
    strong: 'bg-[#091326]/75 backdrop-blur-2xl border-slate-400/20 shadow-2xl',
    solid: 'bg-[#070f1e]/90 backdrop-blur-3xl border-slate-400/25 shadow-2xl',
  };

  return (
    <div
      className={`rounded-2xl border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  hoverable = true,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`p-5 rounded-2xl bg-[#091326]/50 backdrop-blur-xl border border-slate-400/12 shadow-lg ${
        hoverable ? 'hover:bg-[#0c1a32]/70 hover:border-blue-400/35 hover:-translate-y-0.5 hover:shadow-blue-500/10 transition-all duration-250' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  icon,
  label,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 font-sans tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`w-full ${
            icon ? 'pl-10' : 'pl-4'
          } pr-4 py-2.5 rounded-xl bg-white/[0.035] backdrop-blur-md border border-slate-400/15 text-slate-100 placeholder-slate-400/70 text-xs font-sans focus:outline-none focus:bg-white/[0.06] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-xs rounded-xl gap-2 font-semibold',
    lg: 'px-6 py-3 text-sm rounded-xl gap-2.5 font-bold',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-600/90 via-cyan-600/90 to-blue-600/90 hover:from-blue-500 hover:to-cyan-500 text-white border border-cyan-400/30 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:-translate-y-0.5',
    secondary: 'bg-[#091326]/60 hover:bg-[#0d1c38]/80 text-slate-200 hover:text-white border border-slate-400/15 hover:border-slate-400/30 shadow-md',
    ghost: 'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white border border-transparent hover:border-white/10',
    danger: 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-950/50',
  };

  return (
    <button
      className={`inline-flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

interface GlassBadgeProps {
  variant?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'purple' | 'slate';
  children: React.ReactNode;
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = 'blue',
  children,
  className = '',
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    slate: 'bg-slate-500/10 border-slate-400/20 text-slate-300',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full backdrop-blur-md border text-[11px] font-mono font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
