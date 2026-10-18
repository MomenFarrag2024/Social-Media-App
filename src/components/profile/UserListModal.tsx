import type { ReactNode } from 'react';
import type { User } from '../../types';
import { useUserListByIds } from '../../hooks/useUserList';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { FollowButton } from '../common/FollowButton';
import { Skeleton } from '../common/Skeleton';
import { ErrorState } from '../common/States';
import { UserLink } from '../common/UserLink';

/** Either full user objects from the API, or ids that still have to be resolved into users. */
export type UserListSource = { users: User[] } | { ids: string[] };

interface UserListModalProps {
  title: string;
  source: UserListSource;
  emptyText: string;
  onClose: () => void;
}

/** Followers / Following list with loading, empty and error states. Every row links to the user's profile. */
export function UserListModal({ title, source, emptyText, onClose }: UserListModalProps) {
  const ids = 'ids' in source ? source.ids : [];
  const resolved = useUserListByIds(ids, 'ids' in source);
  const users = 'users' in source ? source.users : resolved.users;
  const loadingFirst = 'ids' in source && resolved.isLoading && users.length === 0;

  let body: ReactNode;
  if (loadingFirst) {
    body = (
      <div className="space-y-3" role="status" aria-label="Loading users">
        {[0, 1, 2].map((key) => (
          <div key={key} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    );
  } else if ('ids' in source && resolved.isError) {
    body = (
      <ErrorState
        title="Couldn't load users"
        message="The list couldn't be loaded. Check your connection and try again."
        onRetry={resolved.retry}
      />
    );
  } else if (users.length === 0) {
    body = <p className="py-8 text-center text-sm text-muted">{ids.length > 0 && 'ids' in source ? "These users couldn't be loaded." : emptyText}</p>;
  } else {
    body = (
      <ul className="space-y-3">
        {users.map((person) => (
          <li key={person.id} className="flex items-center gap-3">
            <UserLink user={person} decorative onClick={onClose}>
              <Avatar user={person} size="sm" />
            </UserLink>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                <UserLink user={person} className="hover:underline" onClick={onClose}>
                  {person.name}
                </UserLink>
              </p>
              {person.username && (
                <p className="truncate text-xs text-muted">
                  <UserLink user={person} className="hover:underline" onClick={onClose}>
                    @{person.username}
                  </UserLink>
                </p>
              )}
            </div>
            <FollowButton user={person} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Dialog title={title} onClose={onClose}>
      {body}
      {'ids' in source && resolved.hasMore && !loadingFirst && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" loading={resolved.isLoading} onClick={resolved.loadMore}>
            Load more
          </Button>
        </div>
      )}
      {'ids' in source && resolved.unresolved > 0 && users.length > 0 && (
        <p className="mt-3 text-center text-xs text-muted">
          {resolved.unresolved} {resolved.unresolved === 1 ? 'user' : 'users'} couldn&apos;t be loaded.
        </p>
      )}
    </Dialog>
  );
}
