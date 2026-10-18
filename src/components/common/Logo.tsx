import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-xl bg-brand-gradient shadow-ring-glow ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 text-white" fill="none" stroke="currentColor" strokeWidth="2.4">
        <circle cx="12" cy="12" r="5" />
        <circle cx="18" cy="6" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Social Media App home">
      <LogoMark />
      {showText && <span className="text-xl xl:hidden font-bold tracking-tight text-brand-gradient">Social Media App</span>}
    </Link>
  );
}
