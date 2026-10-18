import { Link, useLocation, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLink2 } from 'react-icons/fi';
import { PostNotFoundError, getErrorMessage } from '../../api/errors';
import { CommentForm } from '../../components/comment/CommentForm';
import { CommentList } from '../../components/comment/CommentList';
import { Button } from '../../components/common/Button';
import { PageTitle } from '../../components/common/PageTitle';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState, ErrorState } from '../../components/common/States';
import { PostCard } from '../../components/post/PostCard';
import { PostSkeleton } from '../../components/post/PostSkeleton';
import { useCreateComment } from '../../hooks/useComments';
import { usePostLookup } from '../../hooks/usePostLookup';
import type { PostLocationState } from '../../types';
import { isRecord } from '../../utils/normalize';

function isPostState(state: unknown, postId: string): state is PostLocationState {
  return isRecord(state) && isRecord(state.post) && state.post.id === postId;
}

function BackToFeed() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-1 text-sm font-semibold text-muted hover:text-ink">
      <FiArrowLeft aria-hidden /> Back to feed
    </Link>
  );
}

export default function PostDetailsPage() {
  const { postId = '' } = useParams();
  const location = useLocation();
  const state: unknown = location.state;
  const statePost = isPostState(state, postId) ? state.post : undefined;

  const lookup = usePostLookup(postId, statePost);
  const createComment = useCreateComment(postId);

  if (lookup.isPending) {
    return (
      <div role="status" aria-label="Looking for this post">
        <PageTitle title="Post Details" />
        <BackToFeed />
        <PostSkeleton />
        <Skeleton className="mt-4 h-16 w-full rounded-2xl" />
      </div>
    );
  }

  if (lookup.isError || !lookup.data) {
    const notFound = lookup.error instanceof PostNotFoundError;
    return (
      <div>
        <PageTitle title="Post Details" />
        <BackToFeed />
        {notFound ? (
          <EmptyState
            icon={FiLink2}
            title="Post not found"
            description="This post couldn't be found. It may have been deleted, or the link may be invalid."
            action={
              <Link to="/">
                <Button>Back to home feed</Button>
              </Link>
            }
          />
        ) : (
          <ErrorState
            title="Couldn't load this post"
            message={getErrorMessage(lookup.error)}
            onRetry={() => void lookup.refetch()}
          />
        )}
      </div>
    );
  }

  const post = lookup.data;

  return (
    <div className="space-y-4">
      <PageTitle title="Post Details" />
      <BackToFeed />
      <PostCard post={post} variant="detail" />

      <section id="comments" aria-labelledby="comments-heading" className="rounded-card border border-line bg-surface shadow-card p-4">
        <h2 id="comments-heading" className="mb-4 text-base font-semibold">
          Comments
        </h2>
        <div className="mb-5">
          <CommentForm
            label="Write a comment"
            allowImage
            onSubmit={(values) => createComment.mutateAsync(values)}
          />
        </div>
        <CommentList postId={post.id} postOwnerId={post.author.id} />
      </section>
    </div>
  );
}
