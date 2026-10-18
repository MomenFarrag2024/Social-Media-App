import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBookmark, FaHeart } from 'react-icons/fa';
import { FiBookmark, FiMessageCircle, FiRepeat, FiShare2, FiHeart } from 'react-icons/fi';
import { getErrorMessage } from '../../api/errors';
import { useAuth } from '../../hooks/useAuth';
import { useDeletePost, useToggleBookmark, useToggleLike } from '../../hooks/usePosts';
import { useToast } from '../../hooks/useToast';
import type { Post, PostLocationState } from '../../types';
import { copyText, postUrl } from '../../utils/clipboard';
import { formatCount, timeAgo } from '../../utils/format';
import { isBookmarkedBy, isLikedBy } from '../../utils/reactions';
import { Avatar } from '../common/Avatar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { FollowButton } from '../common/FollowButton';
import { UserLink } from '../common/UserLink';
import { EditPostDialog } from './EditPostDialog';
import { LikesDialog } from './LikesDialog';
import { PostMenu } from './PostMenu';
import { SharePostDialog } from './SharePostDialog';

interface PostCardProps {
  post: Post;
  /** `feed` shows the top-comment preview and links to details; `detail` is the standalone page. */
  variant?: 'feed' | 'detail';
}

function SharedPostPreview({ post }: { post: Post }) {
  const state: PostLocationState = { post };
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-line">
      <div className="flex items-center gap-2 px-3 pt-3">
        <UserLink user={post.author} decorative>
          <Avatar user={post.author} size="xs" />
        </UserLink>
        <UserLink user={post.author} className="text-sm font-semibold hover:underline">
          {post.author.name}
        </UserLink>
        <span className="text-xs text-muted">{timeAgo(post.createdAt)}</span>
      </div>
      <Link to={`/posts/${post.id}`} state={state} className="block transition hover:bg-soft/60">
        {post.body && <p className="whitespace-pre-wrap break-words px-3 pt-2 text-sm">{post.body}</p>}
        {post.image && (
          <img src={post.image} alt="Shared post" loading="lazy" className="mt-2 max-h-96 w-full object-cover" />
        )}
        <div className="h-3" />
      </Link>
    </div>
  );
}

export function PostCard({ post, variant = 'feed' }: PostCardProps) {
  const { user } = useAuth();
  const like = useToggleLike();
  const bookmark = useToggleBookmark();
  const remove = useDeletePost();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Pop animations run only after a click (never when an already-liked post first renders).
  const [popLike, setPopLike] = useState(false);
  const [popSave, setPopSave] = useState(false);

  const copyLink = async () => {
    // Always this post's own URL (its real id), never the profile or Home URL.
    const copied = await copyText(postUrl(post.id));
    if (copied) toast.push('Link copied to clipboard', 'success');
    else toast.push("Couldn't copy the link. Your browser blocked clipboard access.", 'error');
  };

  const confirmDelete = async () => {
    if (remove.isPending) return; // no duplicate submissions
    setDeleteError(null);
    try {
      await remove.mutateAsync(post.id); // the post leaves the caches only after the server confirms
      setConfirmingDelete(false);
      if (variant === 'detail') navigate('/', { replace: true }); // the post no longer exists
    } catch (error) {
      // The post stays untouched; keep the dialog open with the reason so the user can retry or cancel.
      setDeleteError(getErrorMessage(error, 'Could not delete the post. Please try again.'));
    }
  };
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showLikes, setShowLikes] = useState(false);

  const liked = isLikedBy(post, user?.id);
  const bookmarked = isBookmarkedBy(post, user?.id);
  const isOwner = Boolean(user?.id) && post.author.id === user?.id;
  const state: PostLocationState = { post };
  const detailPath = `/posts/${post.id}`;
  const commentsCount = post.commentsCount ?? 0;

  const actionClass =
    'group flex items-center justify-center gap-2 rounded-lg py-2 text-[15px] font-semibold text-muted transition hover:bg-soft active:scale-[0.97] disabled:opacity-50';

  return (
    <article className="rounded-card border border-line bg-surface shadow-card post-card" aria-label={`Post by ${post.author.name}`}>
      <header className="flex items-center gap-3 px-4 pt-4">
        <UserLink user={post.author} decorative>
          <Avatar user={post.author} />
        </UserLink>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">
            <UserLink user={post.author} className="hover:underline">
              {post.author.name}
            </UserLink>
          </p>
          <p className="truncate text-xs text-muted">
            {post.author.username && (
              <span>
                <UserLink user={post.author} className="hover:underline">
                  @{post.author.username}
                </UserLink>{' '}
                ·{' '}
              </span>
            )}
            <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
            {post.privacy && <span> · {post.privacy}</span>}
          </p>
        </div>
        {!isOwner && <FollowButton user={post.author} />}
        <PostMenu
          isOwner={isOwner}
          onCopyLink={() => void copyLink()}
          onEdit={() => setEditing(true)}
          onDelete={() => {
            setDeleteError(null);
            setConfirmingDelete(true);
          }}
          busy={remove.isPending}
        />
      </header>

      {post.body && <p className="whitespace-pre-wrap break-words px-4 pt-3 text-[15px] leading-relaxed">{post.body}</p>}
      {post.sharedPost && (
        <div className="px-4">
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted">
            <FiRepeat aria-hidden /> Shared a post
          </p>
          <SharedPostPreview post={post.sharedPost} />
        </div>
      )}
      {post.image && (
        <img
          src={post.image}
          alt={`Image posted by ${post.author.name}`}
          loading="lazy"
          className="mx-4 mt-3 max-h-[640px] w-[calc(100%-2rem)] rounded-xl bg-soft object-cover"
        />
      )}

      {(post.likesCount > 0 || commentsCount > 0 || Boolean(post.sharesCount)) && (
        <div className="flex items-center justify-between gap-3 px-4 pt-3 text-[15px] text-muted">
          {post.likesCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowLikes(true)}
              className="inline-flex items-center gap-1.5 hover:underline"
              aria-label={`${formatCount(post.likesCount)} ${post.likesCount === 1 ? 'like' : 'likes'}, see who liked`}
            >
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-like text-white">
                <FaHeart className="h-2.5 w-2.5" aria-hidden />
              </span>
              {formatCount(post.likesCount)}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {commentsCount > 0 &&
              (variant === 'feed' ? (
                <Link to={detailPath} state={state} className="hover:underline">
                  {formatCount(commentsCount)} {commentsCount === 1 ? 'comment' : 'comments'}
                </Link>
              ) : (
                <span>
                  {formatCount(commentsCount)} {commentsCount === 1 ? 'comment' : 'comments'}
                </span>
              ))}
            {post.sharesCount ? (
              <span>
                {formatCount(post.sharesCount)} {post.sharesCount === 1 ? 'share' : 'shares'}
              </span>
            ) : null}
          </div>
        </div>
      )}

      <div role="group" aria-label="Post actions" className="mx-4 mt-2 grid grid-cols-4 gap-1 border-y border-line py-1">
        <button
          type="button"
          className={`${actionClass} ${liked ? 'text-like' : ''}`}
          disabled={like.isPending}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike post' : 'Like post'}
          onClick={() => {
            if (like.isPending) return;
            if (!liked) setPopLike(true);
            like.mutate(post.id);
          }}
        >
          <span className={`inline-flex ${liked && popLike ? 'animate-like-pop' : 'transition-transform group-hover:scale-110'}`}>
            {liked ? <FaHeart className="h-5 w-5" aria-hidden /> : <FiHeart className="h-5 w-5" aria-hidden />}
          </span>
          <span className="max-sm:sr-only">Like</span>
        </button>

        {variant === 'feed' ? (
          <Link to={detailPath} state={state} className={actionClass} aria-label="View comments">
            <FiMessageCircle className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" aria-hidden />
            <span className="max-sm:sr-only">Comment</span>
          </Link>
        ) : (
          <a href="#comments" className={actionClass} aria-label="Go to comments">
            <FiMessageCircle className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" aria-hidden />
            <span className="max-sm:sr-only">Comment</span>
          </a>
        )}

        <button type="button" className={actionClass} onClick={() => setSharing(true)} aria-label="Share post">
          <FiShare2 className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          <span className="max-sm:sr-only">Share</span>
        </button>

        <button
          type="button"
          className={`${actionClass} ${bookmarked ? 'text-brand-from' : ''}`}
          disabled={bookmark.isPending}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
          onClick={() => {
            if (bookmark.isPending) return;
            if (!bookmarked) setPopSave(true);
            bookmark.mutate(post);
          }}
        >
          <span className={`inline-flex ${bookmarked && popSave ? 'animate-bookmark-pop' : 'transition-transform group-hover:-translate-y-0.5'}`}>
            {bookmarked ? <FaBookmark className="h-[18px] w-[18px]" aria-hidden /> : <FiBookmark className="h-5 w-5" aria-hidden />}
          </span>
          <span className="max-sm:sr-only">{bookmarked ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      <div className="space-y-1 px-4 pb-3 pt-2 empty:hidden">
        {variant === 'feed' && post.topComment && (
          <p className="text-sm">
            <UserLink user={post.topComment.author} className="font-semibold hover:underline">
              {post.topComment.author.name}
            </UserLink>{' '}
            <span className="break-words">{post.topComment.content}</span>
          </p>
        )}

        {variant === 'feed' && commentsCount > 0 && (
          <Link to={detailPath} state={state} className="block text-sm text-muted hover:underline">
            View {commentsCount === 1 ? '1 comment' : `all ${formatCount(commentsCount)} comments`}
          </Link>
        )}
      </div>

      {editing && <EditPostDialog post={post} onClose={() => setEditing(false)} />}
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete Post?"
          description="Are you sure you want to delete this post? This action cannot be undone."
          confirmLabel="Delete Post"
          loading={remove.isPending}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
      {sharing && <SharePostDialog post={post} onClose={() => setSharing(false)} />}
      {showLikes && <LikesDialog post={post} onClose={() => setShowLikes(false)} />}
    </article>
  );
}
