import { useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { FiHeart } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import {
  useCreateComment,
  useDeleteComment,
  useToggleCommentLike,
  useUpdateComment,
} from '../../hooks/useComments';
import type { Comment } from '../../types';
import { formatCount, timeAgo } from '../../utils/format';
import { isLikedBy } from '../../utils/reactions';
import { getErrorMessage } from '../../api/errors';
import { Avatar } from '../common/Avatar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UserLink } from '../common/UserLink';
import { CommentForm } from './CommentForm';
import { ReplyList } from './ReplyList';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  postOwnerId: string;
  /** Set when this item is a reply; replies cannot be nested further. */
  parentId?: string;
}

export function CommentItem({ comment, postId, postOwnerId, parentId }: CommentItemProps) {
  const { user } = useAuth();
  const like = useToggleCommentLike(postId);
  const update = useUpdateComment(postId);
  const remove = useDeleteComment(postId);
  const reply = useCreateComment(postId, comment.id);

  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isReply = Boolean(parentId);
  const liked = isLikedBy(comment, user?.id);
  const isOwner = Boolean(user?.id) && comment.author.id === user?.id;
  const isPostOwner = Boolean(user?.id) && postOwnerId === user?.id;
  const canDelete = isOwner || isPostOwner;
  const canHaveReplies = !isReply && (comment.repliesCount === undefined || comment.repliesCount > 0);

  const noun = isReply ? 'reply' : 'comment';
  const deleteComment = async () => {
    if (remove.isPending) return; // no duplicate submissions
    setDeleteError(null);
    try {
      // Only this comment/reply: the mutation is bound to (postId, commentId) and never touches the post.
      await remove.mutateAsync({ commentId: comment.id, parentId });
      setConfirmingDelete(false);
    } catch (error) {
      setDeleteError(getErrorMessage(error, `Could not delete the ${noun}. Please try again.`));
    }
  };

  const actionClass = 'text-xs font-semibold text-muted transition hover:text-ink disabled:opacity-50';

  return (
    <li className="flex gap-3">
      <UserLink user={comment.author} decorative>
        <Avatar user={comment.author} size={isReply ? 'xs' : 'sm'} />
      </UserLink>
      <div className="min-w-0 flex-1">
        {editing ? (
          <CommentForm
            label={`Edit comment ${comment.id}`}
            initialValue={comment.content}
            submitLabel="Save"
            autoFocus
            onCancel={() => setEditing(false)}
            onSubmit={async ({ content }) => {
              await update.mutateAsync({ commentId: comment.id, content });
              setEditing(false);
            }}
          />
        ) : (
          <div className="inline-block max-w-full rounded-2xl bg-soft px-3.5 py-2">
            <p className="text-sm font-semibold">
              <UserLink user={comment.author} className="hover:underline">
                {comment.author.name}
              </UserLink>
            </p>
            {comment.content && <p className="whitespace-pre-wrap break-words text-[15px]">{comment.content}</p>}
            {comment.image && (
              <img
                src={comment.image}
                alt="Comment attachment"
                loading="lazy"
                className="mt-2 max-h-60 rounded-xl object-cover"
              />
            )}
          </div>
        )}

        {!editing && (
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
            <time className="text-xs text-muted" dateTime={comment.createdAt}>
              {timeAgo(comment.createdAt)}
            </time>
            <button
              type="button"
              className={`${actionClass} inline-flex items-center gap-1 ${liked ? 'text-like hover:opacity-80' : ''}`}
              disabled={like.isPending}
              aria-pressed={liked}
              aria-label={liked ? 'Unlike comment' : 'Like comment'}
              onClick={() => {
                if (!like.isPending) like.mutate(comment.id);
              }}
            >
              {liked ? <FaHeart className="h-3 w-3" aria-hidden /> : <FiHeart className="h-3 w-3" aria-hidden />}
              {comment.likesCount > 0 ? formatCount(comment.likesCount) : 'Like'}
            </button>
            {!isReply && (
              <button type="button" className={actionClass} onClick={() => setReplying((open) => !open)}>
                Reply
              </button>
            )}
            {isOwner && (
              <button type="button" className={actionClass} onClick={() => setEditing(true)}>
                Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className={actionClass}
                aria-haspopup="dialog"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmingDelete(true);
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}

        {canHaveReplies && !editing && (
          <button
            type="button"
            className="mt-1 px-1 text-xs font-semibold text-brand-from hover:underline"
            aria-expanded={showReplies}
            onClick={() => setShowReplies((open) => !open)}
          >
            {showReplies
              ? 'Hide replies'
              : comment.repliesCount
                ? `View ${comment.repliesCount === 1 ? '1 reply' : `${formatCount(comment.repliesCount)} replies`}`
                : 'View replies'}
          </button>
        )}

        {replying && !isReply && (
          <div className="mt-2">
            <CommentForm
              label={`Reply to ${comment.id}`}
              placeholder={`Reply to ${comment.author.name}…`}
              allowImage
              autoFocus
              onCancel={() => setReplying(false)}
              onSubmit={async (values) => {
                await reply.mutateAsync(values);
                setReplying(false);
                setShowReplies(true);
              }}
            />
          </div>
        )}

        {showReplies && !isReply && (
          <ReplyList postId={postId} commentId={comment.id} postOwnerId={postOwnerId} />
        )}
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title={isReply ? 'Delete Reply?' : 'Delete Comment?'}
          description={`Are you sure you want to delete this ${noun}? This action cannot be undone.`}
          confirmLabel={isReply ? 'Delete Reply' : 'Delete Comment'}
          loading={remove.isPending}
          error={deleteError}
          onConfirm={() => void deleteComment()}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </li>
  );
}
