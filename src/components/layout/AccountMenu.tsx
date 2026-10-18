import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';
import { Avatar } from '../common/Avatar';

/** Avatar button in the header with profile, settings and log out. Closes on outside press or Escape. */
export function AccountMenu() {
  const { user } = useAuth();
  const { requestLogout, dialog } = useLogoutConfirm();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;
  const itemClass = 'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-[15px] font-medium transition hover:bg-soft';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-soft"
      >
        <Avatar user={user} size="sm" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="animate-pop-in absolute right-0 top-full z-50 mt-2 w-72 origin-top-right rounded-xl border border-line bg-surface p-2 shadow-xl"
        >
          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg p-2 shadow-card transition hover:bg-soft"
          >
            <Avatar user={user} size="md" />
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold">{user.name}</span>
              {user.username && <span className="block truncate text-sm text-muted">@{user.username}</span>}
            </span>
          </Link>
          <div className="mt-1">
            <Link to="/settings" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <FiSettings className="h-5 w-5 text-muted" aria-hidden /> Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                requestLogout();
              }}
            >
              <FiLogOut className="h-5 w-5 text-muted" aria-hidden /> Log out
            </button>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
