import type { CSSProperties, ReactNode } from 'react';

/**
 * Fade-up on mount with a small stagger (`index`, capped in CSS at 6 steps of 40ms). Because it only runs
 * when an element mounts, items that are already on screen never re-animate when a list grows or refetches.
 */
export function Reveal({ index = 0, className = '', children }: { index?: number; className?: string; children: ReactNode }) {
  return (
    <div className={`animate-fade-up ${className}`} style={{ '--i': index } as CSSProperties}>
      {children}
    </div>
  );
}
