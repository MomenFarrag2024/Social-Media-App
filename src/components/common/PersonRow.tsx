import type { User } from '../../types';
import { Avatar } from './Avatar';
import { FollowButton } from './FollowButton';
import { UserLink } from './UserLink';

/** One person: avatar, name, username (all linking to their profile) and the shared Follow button. */
export function PersonRow({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  return (
    <li className="flex items-center gap-3">
      <UserLink user={user} decorative onClick={onNavigate}>
        <Avatar user={user} size="sm" />
      </UserLink>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          <UserLink user={user} className="hover:underline" onClick={onNavigate}>
            {user.name}
          </UserLink>
        </p>
        {user.username && <p className="truncate text-xs text-muted">@{user.username}</p>}
      </div>
      <FollowButton user={user} />
    </li>
  );
}
