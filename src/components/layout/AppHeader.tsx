import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { Logo } from '../common/Logo';
import { AccountMenu } from './AccountMenu';
import { NavSearch } from './NavSearch';
import { NAV_ENTRIES, UnreadBadge, activeNavIndex } from './Sidebar';

/**
 * Top bar. md+: logo, people search, primary navigation, account menu.
 * Mobile: compact bar (logo, search toggle, account menu); primary navigation lives in the bottom bar.
 */
export function AppHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const activeIndex = activeNavIndex(useLocation().pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/80 shadow-card backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none md:basis-72 lg:basis-80 xl:basis-[26rem]">
          <span className="md:hidden">
            <Logo />
          </span>
          <span className="hidden items-center gap-2 md:flex">
            <span className="xl:hidden">
              <Logo showText={false} />
            </span>
            <span className="hidden xl:inline-flex">
              <Logo />
            </span>
            <NavSearch className="hidden w-52 lg:block lg:w-64" />
          </span>
        </div>

        <nav aria-label="Primary" className="hidden flex-1 justify-center md:flex" onMouseLeave={() => setHovered(null)}>
          <div className="relative flex">
            {/* Hover pill and active underline each slide between the equal-width items (transform only). */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-1.5 left-0 w-16 rounded-lg bg-soft transition-[transform,opacity] duration-200 ease-out lg:w-24"
              style={{ transform: `translateX(${(hovered ?? 0) * 100}%)`, opacity: hovered === null ? 0 : 1 }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 w-16 transition-[transform,opacity] duration-300 ease-out lg:w-24"
              style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`, opacity: activeIndex < 0 ? 0 : 1 }}
            >
              <span className="accent-line mx-2 block h-[3px] rounded-t" />
            </span>
            {NAV_ENTRIES.map(({ to, label, icon: Icon, end }, index) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={label}
                title={label}
                onMouseEnter={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                className={({ isActive }) =>
                  `relative z-10 flex h-14 w-16 items-center justify-center transition-colors lg:w-24 ${
                    isActive ? 'text-brand-from' : 'text-muted hover:text-ink'
                  }`
                }
              >
                <span className="relative">
                  <Icon className="h-6 w-6 transition-transform duration-200" aria-hidden />
                  {to === '/notifications' && <UnreadBadge className="absolute -right-3 -top-2 !min-w-4 !px-1 !text-[10px] !leading-4" />}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="flex items-center justify-end gap-1 md:basis-72 lg:basis-80 xl:basis-[26rem]">
          {/* Below lg the inline search box is hidden, so offer it behind a button. */}
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={searchOpen ? 'Close search' : 'Search people'}
            aria-expanded={searchOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-soft text-ink transition hover:bg-line/60 lg:hidden"
          >
            {searchOpen ? <FiX className="h-5 w-5" aria-hidden /> : <FiSearch className="h-5 w-5" aria-hidden />}
          </button>
          <AccountMenu />
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-line px-3 py-2 sm:px-4 lg:hidden">
          <NavSearch autoFocus className="mx-auto max-w-xl" />
        </div>
      )}
    </header>
  );
}
