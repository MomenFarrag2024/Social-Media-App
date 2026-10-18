import type { CSSProperties } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FiMessageCircle, FiSend, FiHeart } from 'react-icons/fi';
import { Logo, LogoMark } from '../components/common/Logo';

const RING_MASK = 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))';

// Slow-drifting specks behind the form. Fixed positions/timings, decorative only, hidden on phones and for
// reduced motion. Only transform/opacity animate.
const PARTICLES = [
  { left: '8%', top: '78%', size: 6, delay: '0s', dur: '16s', dx: '18px' },
  { left: '22%', top: '90%', size: 4, delay: '-5s', dur: '13s', dx: '-14px' },
  { left: '38%', top: '84%', size: 5, delay: '-9s', dur: '18s', dx: '22px' },
  { left: '54%', top: '92%', size: 4, delay: '-3s', dur: '15s', dx: '-10px' },
  { left: '68%', top: '80%', size: 6, delay: '-11s', dur: '17s', dx: '16px' },
  { left: '82%', top: '88%', size: 4, delay: '-7s', dur: '14s', dx: '-20px' },
  { left: '92%', top: '76%', size: 5, delay: '-2s', dur: '19s', dx: '12px' },
] as const;

const HIGHLIGHTS = [
  { icon: FiHeart, label: 'Like' },
  { icon: FiMessageCircle, label: 'Comment' },
  { icon: FiSend, label: 'Share' },
] as const;

/** Shared shell for Login and Register: animated gradient backdrop, brand panel (lg+), and a glass card. */
export function AuthLayout() {
  const { pathname } = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-auth-float absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-from/30 blur-3xl" />
        <div
          className="animate-auth-float absolute -bottom-40 -right-24 h-[32rem] w-[32rem] rounded-full bg-brand-to/25 blur-3xl"
          style={{ animationDelay: '-6s' }}
        />
        <div
          className="animate-auth-float absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-from/15 blur-3xl"
          style={{ animationDelay: '-3s' }}
        />
        {PARTICLES.map((particle) => (
          <span
            key={particle.left}
            className="animate-particle absolute hidden rounded-full bg-brand-from/50 sm:block"
            style={
              {
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                '--delay': particle.delay,
                '--dur': particle.dur,
                '--dx': particle.dx,
              } as CSSProperties
            }
          />
        ))}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(var(--color-line) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse at center, #000, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, #000, transparent 75%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-10 lg:grid-cols-2">
        <section className="hidden lg:block" aria-hidden="true">
          <div className="animate-auth-rise relative mb-8 h-24 w-24" style={{ '--i': 0 } as CSSProperties}>
            <span
              className="animate-auth-ring absolute inset-0 rounded-full"
              style={{
                backgroundImage:
                  'conic-gradient(from 0deg, var(--color-brand-from), var(--color-brand-to), var(--color-brand-from))',
                mask: RING_MASK,
                WebkitMask: RING_MASK,
              }}
            />
            <span className="absolute inset-3 flex items-center justify-center">
              <LogoMark className="h-14 w-14" />
            </span>
          </div>
          <h2
            className="animate-auth-rise max-w-md text-5xl font-extrabold leading-[1.1] tracking-tight"
            style={{ '--i': 1 } as CSSProperties}
          >
            Share moments.
            <br />
            <span className="auth-sheen-text">Stay close.</span>
          </h2>
          <p className="animate-auth-rise mt-4 max-w-sm text-muted" style={{ '--i': 2 } as CSSProperties}>
            Post, react, and talk with the people you care about, all in one place.
          </p>
          <ul className="mt-8 flex gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }, index) => (
              <li
                key={label}
                className="animate-auth-rise flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-2 text-sm font-medium backdrop-blur"
                style={{ '--i': index + 3 } as CSSProperties}
              >
                <Icon className="h-4 w-4 text-brand-from" /> {label}
              </li>
            ))}
          </ul>
        </section>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden">
            <Logo />
          </div>
          {/* Keyed by route so switching between Login and Register replays the entrance. */}
          <div
            key={pathname}
            className="animate-auth-rise rounded-card border border-line bg-surface/80 p-6 shadow-xl backdrop-blur-xl sm:p-8"
          >
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
