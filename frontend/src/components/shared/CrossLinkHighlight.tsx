import React, { useEffect, useRef } from 'react';

interface CrossLinkHighlightProps {
  id: string;
  activeHighlightId: string | null;
  children: React.ReactNode;
  className?: string;
}

export const CrossLinkHighlight: React.FC<CrossLinkHighlightProps> = ({
  id,
  activeHighlightId,
  children,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isHighlighted = activeHighlightId === id;

  useEffect(() => {
    if (isHighlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isHighlighted]);

  return (
    <div
      ref={ref}
      data-crosslink-id={id}
      className={`cross-link-target ${isHighlighted ? 'highlighted context-highlight' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
