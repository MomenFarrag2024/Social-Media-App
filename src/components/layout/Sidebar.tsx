import { NavLink } from 'react-router-dom';
import { FiBell, FiHome, FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';
import { useUnreadCount } from '../../hooks/useNotifications';
import { Avatar } from '../common/Avatar';
import { UserLink } from '../common/UserLink';

interface NavEntry {
  to: string;
  label: string;
  icon: IconType;
  end?: boolean;
}

/** Primary destinations, shared by the header, the left sidebar and the mobile bottom bar. */
export const NAV_ENTRIES: NavEntry[] = [
  { to: '/', label: 'Home', icon: FiHome, end: true },
  { to: '/notifications', label: 'Notifications', icon: FiBell },
  { to: '/profile', label: 'Profile', icon: FiUser },
  { to: '/settings', label: 'Settings', icon: FiSettings },
];

/** Index of the primary destination that matches `pathname`, or -1 (e.g. on a post or another user's profile). */
export function activeNavIndex(pathname: string): number {
  return NAV_ENTRIES.findIndex(({ to, end }) => (end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)));
}

/** Real unread count from the API, capped for display only ("9+"); the exact number stays in the label. */
export function UnreadBadge({ className = '' }: { className?: string }) {
  const { data } = useUnreadCount();
  if (!data || data <= 0) return null; // zero, loading or failed: no badge, navigation unaffected
  return (
    <span
      key={data}
      className={`animate-badge-pop inline-flex min-w-5 items-center justify-center rounded-full bg-badge px-1.5 text-[11px] font-bold leading-5 text-white ring-2 ring-surface ${className}`}
      aria-label={`${data} unread ${data === 1 ? 'notification' : 'notifications'}`}
    >
      {data > 9 ? '9+' : data}
    </span>
  );
}

/** Left column on wide screens: profile shortcut, primary links and log out. */
export function Sidebar() {
  const { user } = useAuth();
  const { requestLogout, dialog } = useLogoutConfirm();

  return (
    <aside
      aria-label="Shortcuts"
      className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 flex-col gap-1 overflow-y-auto px-2 py-4 xl:flex"
    >
      {user && (
        <UserLink
          user={user}
          className="mb-1 flex items-center gap-3 rounded-lg p-2 text-[15px] font-semibold transition hover:bg-soft"
        >
          <Avatar user={user} size="sm" />
          <span className="min-w-0 truncate">{user.name}</span>
        </UserLink>
      )}

      <nav aria-label="Primary" className="flex flex-col gap-0.5">
        {NAV_ENTRIES.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg p-2 text-[15px] font-medium transition hover:bg-soft ${
                isActive ? 'bg-brand-soft text-brand-from' : 'text-ink'
              }`
            }
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-soft text-brand-from">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            {label}
            {to === '/notifications' && <UnreadBadge className="ml-auto" />}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={requestLogout}
        className="mt-1 flex items-center gap-3 rounded-lg p-2 text-[15px] font-medium text-ink transition hover:bg-soft"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-soft text-muted">
          <FiLogOut className="h-5 w-5" aria-hidden />
        </span>
        Log out
      </button>
      {dialog}

    </aside>
  );
}
