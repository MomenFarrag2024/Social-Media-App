import { useMemo } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { getErrorMessage } from '../../api/errors';
import { useComments } from '../../hooks/useComments';
import { dedupeById } from '../../utils/normalize';
import { LoadMore } from '../common/LoadMore';
import { Skeleton } from '../common/Skeleton';
import { EmptyState, ErrorState } from '../common/States';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  postId: string;
  postOwnerId: string;
}

export function CommentList({ postId, postOwnerId }: CommentListProps) {
  const comments = useComments(postId);
  const items = useMemo(() => dedupeById(comments.data?.pages.flatMap((page) => page.items) ?? []), [comments.data]);

  if (comments.isPending) {
    return (
      <ul className="space-y-4" role="status" aria-label="Loading comments">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className="flex gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-14 w-2/3 rounded-2xl" />
          </li>
        ))}
      </ul>
    );
  }

  if (comments.isError) {
    return (
      <ErrorState
        title="Couldn't load comments"
        message={getErrorMessage(comments.error)}
        onRetry={() => void comments.refetch()}
      />
    );
  }

  if (items.length === 0) {
    return <EmptyState icon={FiMessageCircle} title="No comments yet" description="Start the conversation." />;
  }

  return (
    <>
      <ul className="space-y-4">
        {items.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} postOwnerId={postOwnerId} />
        ))}
      </ul>
      <LoadMore
        hasNextPage={Boolean(comments.hasNextPage)}
        isFetching={comments.isFetchingNextPage}
        onLoadMore={() => void comments.fetchNextPage()}
      />
    </>
  );
}
