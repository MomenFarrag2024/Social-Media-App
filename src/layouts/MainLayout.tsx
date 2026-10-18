import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '../components/layout/AppHeader';
import { BottomNav } from '../components/layout/BottomNav';
import { RightRail } from '../components/layout/RightRail';
import { Sidebar } from '../components/layout/Sidebar';

/** Pages that show the "Suggested for you" rail. Profiles and settings use the full width instead. */
function showsRail(pathname: string): boolean {
  return pathname === '/' || pathname === '/notifications' || pathname.startsWith('/posts/');
}

/** Profiles need room for the cover and two columns; everything else is a single readable column. */
function isWide(pathname: string): boolean {
  return pathname === '/profile' || pathname.startsWith('/users/');
}

export function MainLayout() {
  const { pathname } = useLocation();

  // Start each page at the top when navigating between routes.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const rail = showsRail(pathname);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-3 pb-24 pt-4 sm:px-4 md:pb-8">
          <div className={`mx-auto w-full ${isWide(pathname) ? 'max-w-[1000px]' : 'max-w-[680px]'}`}>
            {/* Keyed by path only: tabs and query changes inside a page don't replay it. */}
            <div key={pathname} className="animate-page-in">
              <Outlet />
            </div>
          </div>
        </main>
        {rail && <RightRail />}
        {/* Keeps the centred column centred on pages that hide the rail. */}
        {!rail && <div aria-hidden="true" className="hidden w-80 shrink-0 xl:block" />}
      </div>
      <BottomNav />
    </div>
  );
}
