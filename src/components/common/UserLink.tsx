import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { User, UserLocationState } from '../../types';

interface UserLinkProps {
  user: User;
  children: ReactNode;
  className?: string;
  /** Label for links whose content has no text (e.g. an avatar). */
  ariaLabel?: string;
  /** Skip this link in keyboard order / screen readers when a neighbouring link goes to the same place. */
  decorative?: boolean;
  /** Runs on click, e.g. to close a dialog before the route changes. */
  onClick?: () => void;
}

/**
 * Links to a user's profile: `/profile` for the signed-in user, `/users/:id` for everyone else.
 * Renders plain text when the API did not return an id for the user (nothing to link to).
 */
export function UserLink({ user, children, className, ariaLabel, decorative, onClick }: UserLinkProps) {
  const { user: me } = useAuth();
  if (!user.id) return <span className={className}>{children}</span>;

  const isMe = me?.id === user.id;
  const state: UserLocationState | undefined = isMe ? undefined : { user };

  return (
    <Link
      to={isMe ? '/profile' : `/users/${encodeURIComponent(user.id)}`}
      state={state}
      className={className}
      onClick={onClick}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative ? true : undefined}
      tabIndex={decorative ? -1 : undefined}
    >
      {children}
    </Link>
  );
}
