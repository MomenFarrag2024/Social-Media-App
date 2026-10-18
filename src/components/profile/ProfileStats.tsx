import { useState } from 'react';
import type { User } from '../../types';
import { formatCount } from '../../utils/format';
import { UserListModal, type UserListSource } from './UserListModal';

type OpenList = 'followers' | 'following' | null;

/** Populated users win; otherwise bare ids can still be resolved into users. Undefined = nothing to open. */
function listSource(users: User[] | undefined, ids: string[] | undefined): UserListSource | undefined {
  if (users) return { users };
  if (ids) return { ids };
  return undefined;
}

/**
 * Posts / Followers / Following counts. Followers and Following become buttons only when the API
 * returned the actual users (not just a number or bare ids); otherwise they stay plain text.
 */
export function ProfileStats({
  user,
  align = 'center',
  className = 'mt-5',
}: {
  user: User;
  align?: 'center' | 'start';
  className?: string;
}) {
  const [open, setOpen] = useState<OpenList>(null);

  const followers = listSource(user.followersList, user.followersIds);
  const following = listSource(user.followingList, user.followingIds);
  const items = [
    { key: 'posts', label: 'Posts', value: user.stats.posts, list: undefined },
    {
      key: 'followers',
      label: 'Followers',
      value: user.stats.followers ?? user.followersList?.length ?? user.followersIds?.length,
      list: followers,
    },
    {
      key: 'following',
      label: 'Following',
      value: user.stats.following ?? user.followingList?.length ?? user.followingIds?.length,
      list: following,
    },
  ].filter((item): item is typeof item & { value: number } => item.value !== undefined);

  if (items.length === 0) return null;

  const listsMissing = items.some((item) => item.key !== 'posts' && !item.list);
  const body = (item: (typeof items)[number]) => (
    <>
      <span className="block text-lg font-bold">{formatCount(item.value)}</span>
      <span className="block text-xs text-muted">{item.label}</span>
    </>
  );

  return (
    <div className={className}>
      <div className={`flex gap-8 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {items.map((item) =>
          item.list ? (
            <button
              key={item.key}
              type="button"
              className="rounded-lg px-2 text-center transition hover:bg-soft"
              onClick={() => setOpen(item.key === 'followers' ? 'followers' : 'following')}
              aria-haspopup="dialog"
              aria-label={`${formatCount(item.value)} ${item.label}, view list`}
            >
              {body(item)}
            </button>
          ) : (
            <div key={item.key} className="px-2 text-center">
              {body(item)}
            </div>
          ),
        )}
      </div>
      {listsMissing && (
        <p className={`mt-3 max-w-xs text-xs text-muted ${align === 'center' ? 'mx-auto text-center' : ''}`}>
          Follower and following lists aren&apos;t available: the API returned counts without the users or their ids.
        </p>
      )}

      {open === 'followers' && followers && (
        <UserListModal
          title="Followers"
          source={followers}
          emptyText="No followers yet."
          onClose={() => setOpen(null)}
        />
      )}
      {open === 'following' && following && (
        <UserListModal
          title="Following"
          source={following}
          emptyText="Not following anyone yet."
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
