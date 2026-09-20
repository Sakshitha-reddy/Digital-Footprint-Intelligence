/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#080c15",
          canvas: "#0b101b",
          card: "#0f1626",
          cardHover: "#141c2f",
          border: "#172540",
          borderHover: "rgba(255, 255, 255, 0.14)",
          cyan: "#00F0FF",
          primary: "#3b82f6",
          primaryGlow: "rgba(59, 130, 246, 0.15)",
          accent: "#0ea5e9",
          emerald: "#10b981",
          emeraldBg: "rgba(16, 185, 129, 0.08)",
          amber: "#f59e0b",
          amberBg: "rgba(245, 158, 11, 0.08)",
          rose: "#f43f5e",
          roseBg: "rgba(244, 63, 94, 0.08)",
          muted: "#94a3b8",
          subtle: "#64748b",
        },
        priority: {
          critical: "#f43f5e",
          criticalBg: "rgba(244, 63, 94, 0.08)",
          warning: "#f59e0b",
          warningBg: "rgba(245, 158, 11, 0.08)",
          info: "#3b82f6",
          infoBg: "rgba(59, 130, 246, 0.08)",
          muted: "#475569",
          mutedBg: "rgba(71, 85, 105, 0.08)",
          success: "#10b981",
          successBg: "rgba(16, 185, 129, 0.08)",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.015em',
      },
      boxShadow: {
        'subtle-card': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        'elevated-card': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'glow-primary': '0 0 30px -5px rgba(59, 130, 246, 0.25)',
        'glow-emerald': '0 0 30px -5px rgba(16, 185, 129, 0.25)',
        'glow-cyan': '0 0 30px -5px rgba(0, 240, 255, 0.25)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.20)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.20)',
        'depth-1': '0 1px 2px rgba(0,0,0,0.4)',
        'depth-2': '0 4px 12px -2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        'depth-3': '0 8px 24px -4px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
        'depth-4': '0 16px 48px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'provenance-pulse': 'provenancePulse 2s ease-in-out infinite',
        'context-highlight': 'contextHighlight 1.5s ease-out',
        'reveal-down': 'revealDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'border-flow': 'borderFlow 3s linear infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        provenancePulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 240, 255, 0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(0, 240, 255, 0.15)' },
        },
        contextHighlight: {
          '0%': { boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
          '100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)', backgroundColor: 'transparent' },
        },
        revealDown: {
          '0%': { opacity: '0', maxHeight: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', maxHeight: '800px', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        borderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
}
