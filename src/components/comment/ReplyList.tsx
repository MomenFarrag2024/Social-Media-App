import { useMemo } from 'react';
import { getErrorMessage } from '../../api/errors';
import { useReplies } from '../../hooks/useComments';
import { dedupeById } from '../../utils/normalize';
import { LoadMore } from '../common/LoadMore';
import { Spinner } from '../common/Spinner';
import { CommentItem } from './CommentItem';

interface ReplyListProps {
  postId: string;
  commentId: string;
  postOwnerId: string;
}

export function ReplyList({ postId, commentId, postOwnerId }: ReplyListProps) {
  const replies = useReplies(postId, commentId, true);
  const items = useMemo(() => dedupeById(replies.data?.pages.flatMap((page) => page.items) ?? []), [replies.data]);

  return (
    <div className="mt-3 border-l-2 border-line pl-3">
      {replies.isPending && (
        <p role="status" className="flex items-center gap-2 text-xs text-muted">
          <Spinner className="h-4 w-4" /> Loading replies…
        </p>
      )}
      {replies.isError && (
        <p role="alert" className="text-xs text-danger">
          {getErrorMessage(replies.error, 'Could not load replies.')}{' '}
          <button type="button" className="font-semibold underline" onClick={() => void replies.refetch()}>
            Retry
          </button>
        </p>
      )}
      {replies.isSuccess && items.length === 0 && <p className="text-xs text-muted">No replies yet.</p>}
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} postOwnerId={postOwnerId} parentId={commentId} />
          ))}
        </ul>
      )}
      <LoadMore
        hasNextPage={Boolean(replies.hasNextPage)}
        isFetching={replies.isFetchingNextPage}
        onLoadMore={() => void replies.fetchNextPage()}
      />
    </div>
  );
}
