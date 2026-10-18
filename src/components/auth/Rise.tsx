import type { CSSProperties, ReactNode } from 'react';

/** Staggered entrance wrapper for auth screens; `index` sets the delay. Disabled by prefers-reduced-motion. */
export function Rise({ index, className = '', children }: { index: number; className?: string; children: ReactNode }) {
  return (
    <div className={`animate-auth-rise ${className}`} style={{ '--i': index } as CSSProperties}>
      {children}
    </div>
  );
}
