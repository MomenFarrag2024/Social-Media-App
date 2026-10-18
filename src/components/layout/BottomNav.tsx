import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ENTRIES, UnreadBadge, activeNavIndex } from './Sidebar';

export function BottomNav() {
  const activeIndex = activeNavIndex(useLocation().pathname);
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0/0.18)] backdrop-blur-xl md:hidden"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-0.5 w-1/4 transition-[transform,opacity] duration-300 ease-out"
        style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`, opacity: activeIndex < 0 ? 0 : 1 }}
      >
        <span className="accent-line mx-4 block h-full rounded-b" />
      </span>
      {NAV_ENTRIES.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `relative flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors ${isActive ? 'font-semibold text-brand-from [&_svg]:drop-shadow-[0_0_6px_var(--color-brand-from)]' : 'text-muted'}`
          }
        >
          <span className="relative">
            <Icon className="h-6 w-6" aria-hidden />
            {to === '/notifications' && <UnreadBadge className="absolute -right-3 -top-2 !min-w-4 !px-1 !text-[10px] !leading-4" />}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
