import { useMemo } from 'react';
import { getErrorMessage } from '../../api/errors';
import { usePostLikes } from '../../hooks/usePosts';
import type { Post } from '../../types';
import { dedupeById } from '../../utils/normalize';
import { Avatar } from '../common/Avatar';
import { UserLink } from '../common/UserLink';
import { Dialog } from '../common/Dialog';
import { FollowButton } from '../common/FollowButton';
import { LoadMore } from '../common/LoadMore';
import { Spinner } from '../common/Spinner';
import { ErrorState } from '../common/States';

export function LikesDialog({ post, onClose }: { post: Post; onClose: () => void }) {
  const likes = usePostLikes(post.id, true);
  const users = useMemo(() => dedupeById(likes.data?.pages.flatMap((page) => page.items) ?? []), [likes.data]);

  return (
    <Dialog title="Likes" onClose={onClose}>
      {likes.isPending && (
        <div className="flex justify-center py-8 text-muted" role="status">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {likes.isError && (
        <ErrorState message={getErrorMessage(likes.error)} onRetry={() => void likes.refetch()} />
      )}
      {likes.isSuccess && users.length === 0 && <p className="py-6 text-center text-sm text-muted">No likes yet.</p>}
      {users.length > 0 && (
        <ul className="space-y-3">
          {users.map((user) => (
            <li key={user.id || user.username} className="flex items-center gap-3">
              <UserLink user={user} decorative onClick={onClose}>
                <Avatar user={user} size="sm" />
              </UserLink>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  <UserLink user={user} className="hover:underline" onClick={onClose}>
                    {user.username ?? user.name}
                  </UserLink>
                </p>
                <p className="truncate text-xs text-muted">{user.name}</p>
              </div>
              <FollowButton user={user} />
            </li>
          ))}
        </ul>
      )}
      <LoadMore
        hasNextPage={Boolean(likes.hasNextPage)}
        isFetching={likes.isFetchingNextPage}
        onLoadMore={() => void likes.fetchNextPage()}
      />
    </Dialog>
  );
}
