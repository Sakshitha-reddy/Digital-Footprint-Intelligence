import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Shield, Code2, Globe2, MessageCircle, BriefcaseBusiness, Trophy, Swords, ExternalLink } from 'lucide-react';

// 1. Central Target Node — with pulsing confidence ring
export const TargetNode = memo(({ data }: any) => {
  return (
    <div className={`px-4 py-3 rounded-2xl bg-cyan-950/90 border-2 text-white min-w-[200px] relative transition-all ${
      data.highlighted ? 'border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.3)]'
    }`}>
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-cyan-400" />
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-cyan-400" />

      <div className="flex items-center space-x-3">
        {data.avatar ? (
          <div className="relative">
            <img src={data.avatar} alt={data.label} className="w-10 h-10 rounded-full object-cover border border-cyan-400" />
            {data.confidence != null && (
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-cyan-950 ${
                (data.confidence * 100) >= 80 ? 'bg-emerald-400' : (data.confidence * 100) >= 60 ? 'bg-amber-400' : 'bg-rose-400'
              }`} />
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-cyan-900 flex items-center justify-center animate-glow-pulse">
            <Shield className="w-5 h-5 text-cyan-300" />
          </div>
        )}
        <div>
          <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider block font-bold">
            {data.sublabel || 'PRIMARY IDENTITY'}
          </span>
          <h4 className="font-extrabold text-sm text-white tracking-tight">{data.label}</h4>
        </div>
      </div>
    </div>
  );
});

// 2. Public Platform Account Node — with provenance indicator
export const ProfileNode = memo(({ data }: any) => {
  const getIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'github': return <Globe2 className="w-4 h-4 text-white" />;
      case 'leetcode': return <Code2 className="w-4 h-4 text-amber-400" />;
      case 'codechef': return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'codeforces': return <Swords className="w-4 h-4 text-rose-400" />;
      case 'x/twitter':
      case 'x':
      case 'twitter': return <MessageCircle className="w-4 h-4 text-cyan-400" />;
      case 'linkedin': return <BriefcaseBusiness className="w-4 h-4 text-blue-400" />;
      default: return <ExternalLink className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'github': return 'border-emerald-500/40 hover:border-emerald-400';
      case 'leetcode': return 'border-amber-500/40 hover:border-amber-400';
      case 'codechef': return 'border-yellow-500/40 hover:border-yellow-400';
      case 'codeforces': return 'border-rose-500/40 hover:border-rose-400';
      case 'x/twitter': case 'x': case 'twitter': return 'border-slate-500/40 hover:border-slate-400';
      case 'linkedin': return 'border-blue-500/40 hover:border-blue-400';
      default: return 'border-slate-700 hover:border-cyan-400';
    }
  };

  return (
    <div className={`px-3 py-2.5 rounded-xl bg-slate-900/90 border text-white min-w-[170px] shadow-lg transition-all ${
      data.highlighted ? 'border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : getPlatformColor(data.platform)
    }`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-slate-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-slate-500" />

      <div className="flex items-center space-x-2.5">
        <div className="relative">
          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
            {getIcon(data.platform)}
          </div>
          {/* Confidence dot */}
          {data.confidence != null && (
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
              (data.confidence * 100) >= 80 ? 'bg-emerald-400' : (data.confidence * 100) >= 60 ? 'bg-amber-400' : 'bg-rose-400'
            }`} />
          )}
        </div>
        <div className="overflow-hidden">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">{data.sublabel}</span>
          <h5 className="font-bold text-xs text-cyan-300 truncate font-mono">{data.label}</h5>
        </div>
      </div>
    </div>
  );
});

// 3. Project / Repository Node — with confidence ring
export const ProjectNode = memo(({ data }: any) => {
  return (
    <div className={`px-3 py-2 rounded-xl bg-slate-950/90 border text-white min-w-[160px] shadow-md transition-all ${
      data.highlighted ? 'border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-emerald-500/40'
    }`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-emerald-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-emerald-500" />

      <div className="flex items-center space-x-2">
        <Code2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <div className="overflow-hidden">
          <span className="text-[9px] font-mono text-emerald-400 uppercase block">Repository</span>
          <h5 className="font-semibold text-xs text-white truncate">{data.label}</h5>
        </div>
      </div>
    </div>
  );
});

// 4. Event / Hackathon Node
export const EventNode = memo(({ data }: any) => {
  return (
    <div className={`px-3 py-2 rounded-xl bg-slate-950/90 border text-white min-w-[160px] shadow-md transition-all ${
      data.highlighted ? 'border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-amber-500/40'
    }`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-amber-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-amber-500" />

      <div className="flex items-center space-x-2">
        <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <div className="overflow-hidden">
          <span className="text-[9px] font-mono text-amber-400 uppercase block">Event / Hackathon</span>
          <h5 className="font-semibold text-xs text-white truncate">{data.label}</h5>
        </div>
      </div>
    </div>
  );
});
