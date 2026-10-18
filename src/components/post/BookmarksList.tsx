import { useMemo } from 'react';
import { FiBookmark } from 'react-icons/fi';
import { getErrorMessage } from '../../api/errors';
import { isNotFound } from '../../api/users.api';
import { useBookmarks } from '../../hooks/usePosts';
import { dedupeById } from '../../utils/normalize';
import { LoadMore } from '../common/LoadMore';
import { EmptyState, ErrorState } from '../common/States';
import { Reveal } from '../common/Reveal';
import { PostCard } from './PostCard';
import { PostSkeleton } from './PostSkeleton';

/** Posts the signed-in user has saved, from GET /users/bookmarks. */
export function BookmarksList() {
  const query = useBookmarks();
  const posts = useMemo(() => dedupeById(query.data?.pages.flatMap((page) => page.items) ?? []), [query.data]);

  if (query.isPending) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading saved posts">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (query.isError) {
    if (isNotFound(query.error)) {
      return (
        <EmptyState
          icon={FiBookmark}
          title="Saved posts aren't available"
          description="The API didn't provide a list of saved posts, so they can't be shown here. Bookmarking a post still works."
        />
      );
    }
    return (
      <ErrorState
        title="Couldn't load saved posts"
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={FiBookmark}
        title="No saved posts yet"
        description="Tap the bookmark on any post to save it here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <Reveal key={post.id} index={index % 10}>
          <PostCard post={post} />
        </Reveal>
      ))}
      <LoadMore
        hasNextPage={Boolean(query.hasNextPage)}
        isFetching={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
        endLabel="That's everything you've saved"
      />
    </div>
  );
}
