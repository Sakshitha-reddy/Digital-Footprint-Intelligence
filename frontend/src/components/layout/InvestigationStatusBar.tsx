import React from 'react';
import { Shield, Globe, AlertTriangle, ShieldCheck, Clock, Zap } from 'lucide-react';
import { InvestigationResult } from '../../types/intelligence';

interface InvestigationStatusBarProps {
  result: InvestigationResult | null;
}

export const InvestigationStatusBar: React.FC<InvestigationStatusBarProps> = ({ result }) => {
  if (!result) return null;

  const isHigh = result.overall_confidence >= 80;
  const isMed = result.overall_confidence >= 60;

  return (
    <footer className="status-bar fixed bottom-0 left-0 right-0 z-30 h-7 flex items-center no-print">
      <div className="status-bar-item">
        <Shield className="w-3 h-3 text-blue-400" />
        <span className="status-bar-item-value">{result.investigation_id.slice(0, 8)}</span>
      </div>

      <div className="status-bar-item">
        <Globe className="w-3 h-3 text-cyan-400" />
        <span>{result.profiles.length}</span>
        <span className="status-bar-item-value">Profiles</span>
      </div>

      <div className="status-bar-item">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <span>{result.claims.filter(c => c.status === 'CONFIRMED').length}/{result.claims.length}</span>
        <span className="status-bar-item-value">Claims</span>
      </div>

      {result.conflicts.length > 0 && (
        <div className="status-bar-item">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400">{result.conflicts.length}</span>
          <span className="status-bar-item-value">Conflicts</span>
        </div>
      )}

      <div className="status-bar-item">
        <Clock className="w-3 h-3" />
        <span>{result.timeline.length}</span>
        <span className="status-bar-item-value">Events</span>
      </div>

      <div className="ml-auto status-bar-item border-r-0 border-l border-l-white/[0.04]">
        <Zap className={`w-3 h-3 ${isHigh ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-rose-400'}`} />
        <span className={`font-bold ${isHigh ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-rose-400'}`}>
          {result.overall_confidence}%
        </span>
        <span className="status-bar-item-value">Confidence</span>
      </div>
    </footer>
  );
};
