import React from 'react';

interface ConfidenceGaugeProps {
  value: number;         // 0-100
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'ring' | 'bar';
  showLabel?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: { dim: 24, stroke: 3, fontSize: '7px' },
  sm: { dim: 36, stroke: 4, fontSize: '9px' },
  md: { dim: 56, stroke: 5, fontSize: '13px' },
  lg: { dim: 80, stroke: 6, fontSize: '18px' },
};

function getColor(value: number): string {
  if (value >= 80) return '#10b981';
  if (value >= 60) return '#f59e0b';
  return '#f43f5e';
}

function getTrailColor(): string {
  return 'rgba(255, 255, 255, 0.06)';
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  value,
  size = 'sm',
  variant = 'ring',
  showLabel = true,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const color = getColor(clamped);

  if (variant === 'bar') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: getTrailColor() }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${clamped}%`, background: color }}
          />
        </div>
        {showLabel && (
          <span className="text-xs font-mono font-bold" style={{ color, minWidth: '30px', textAlign: 'right' }}>
            {clamped}%
          </span>
        )}
      </div>
    );
  }

  // Ring variant
  const { dim, stroke, fontSize } = SIZE_MAP[size];
  const radius = (dim - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * clamped) / 100;

  return (
    <div className={`confidence-gauge ${className}`} style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="transform -rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          stroke={getTrailColor()}
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000"
        />
      </svg>
      {showLabel && (
        <span
          className="confidence-gauge-label"
          style={{ fontSize, color }}
        >
          {clamped}
        </span>
      )}
    </div>
  );
};
