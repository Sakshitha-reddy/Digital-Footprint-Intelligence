import React from 'react';
import { ExternalLink, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface ProvenanceBadgeProps {
  platform: string;
  url?: string;
  timestamp?: string;
  verified?: boolean;
  origin?: 'discovered' | 'user_provided' | string;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  platform,
  url,
  timestamp,
  verified = false,
  origin,
  className = '',
}) => {
  const Wrapper = url ? 'a' : 'span';
  const linkProps = url
    ? { href: url, target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};

  const isUserProvided = origin === 'user_provided';

  return (
    <Wrapper
      {...linkProps}
      className={`provenance-badge ${verified ? 'provenance-badge-verified' : ''} ${
        isUserProvided ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : ''
      } ${className}`}
      title={timestamp ? `Retrieved: ${timestamp}` : `Source: ${platform}`}
    >
      {verified ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
      ) : (
        <ExternalLink className="w-3 h-3 flex-shrink-0" />
      )}
      <span className="font-medium">{platform}</span>
      {isUserProvided && (
        <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-200 font-mono">
          USER-ANCHOR
        </span>
      )}
      {timestamp && (
        <span className="text-slate-500 hidden sm:inline">
          <Clock className="w-2.5 h-2.5 inline ml-0.5" />
        </span>
      )}
    </Wrapper>
  );
};
