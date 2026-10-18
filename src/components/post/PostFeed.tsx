import { useEffect, useMemo } from 'react';
import { FiImage } from 'react-icons/fi';
import { getErrorMessage } from '../../api/errors';
import { useFeed } from '../../hooks/usePosts';
import type { FeedFilter, Post } from '../../types';
import { dedupeById } from '../../utils/normalize';
import { LoadMore } from '../common/LoadMore';
import { EmptyState, ErrorState } from '../common/States';
import { Reveal } from '../common/Reveal';
import { PostCard } from './PostCard';
import { PostSkeleton } from './PostSkeleton';

interface PostFeedProps {
  only: FeedFilter;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Keeps only matching posts (e.g. shared posts). More pages are loaded automatically while nothing matches yet. */
  filter?: (post: Post) => boolean;
}

export function PostFeed({
  only,
  emptyTitle = 'No posts yet',
  emptyDescription = 'When posts are published they will show up here.',
  filter,
}: PostFeedProps) {
  const feed = useFeed(only);
  const posts = useMemo(() => {
    const all = dedupeById(feed.data?.pages.flatMap((page) => page.items) ?? []);
    return filter ? all.filter(filter) : all;
  }, [feed.data, filter]);

  // A filter can leave the loaded pages empty while matching posts exist further back: keep paging.
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = feed;
  const paging = Boolean(filter) && posts.length === 0 && hasNextPage && !isFetchNextPageError;
  useEffect(() => {
    if (paging && !isFetchingNextPage) void fetchNextPage();
  }, [paging, isFetchingNextPage, fetchNextPage]);

  if (feed.isPending) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading posts">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (feed.isError) {
    return (
      <ErrorState
        title="Couldn't load posts"
        message={getErrorMessage(feed.error)}
        onRetry={() => void feed.refetch()}
      />
    );
  }

  if (paging) {
    return (
      <div className="space-y-4" role="status" aria-label="Looking for posts">
        <PostSkeleton />
      </div>
    );
  }

  if (posts.length === 0) {
    return <EmptyState icon={FiImage} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <Reveal key={post.id} index={index % 10}>
          <PostCard post={post} />
        </Reveal>
      ))}
      {feed.isFetchNextPageError ? (
        <div role="alert" className="py-4 text-center text-sm text-muted">
          Couldn&apos;t load more posts.{' '}
          <button type="button" className="font-medium text-brand-from hover:underline" onClick={() => void feed.fetchNextPage()}>
            Retry
          </button>
        </div>
      ) : (
        <LoadMore
          hasNextPage={Boolean(feed.hasNextPage)}
          isFetching={feed.isFetchingNextPage}
          onLoadMore={() => void feed.fetchNextPage()}
          endLabel="You're all caught up"
        />
      )}
    </div>
  );
}
