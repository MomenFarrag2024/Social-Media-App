import { useMemo } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft, FiImage, FiUserX } from 'react-icons/fi';
import { getErrorMessage } from '../../api/errors';
import { isNotFound } from '../../api/users.api';
import { Button } from '../../components/common/Button';
import { LoadMore } from '../../components/common/LoadMore';
import { PageTitle } from '../../components/common/PageTitle';
import { Reveal } from '../../components/common/Reveal';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState, ErrorState } from '../../components/common/States';
import { PostCard } from '../../components/post/PostCard';
import { PostSkeleton } from '../../components/post/PostSkeleton';
import { ProfileInfo } from '../../components/profile/ProfileInfo';
import { PublicProfileHeader, type ProfileStatus } from '../../components/profile/PublicProfileHeader';
import { SCAN_PAGE_SIZE, usePublicProfile } from '../../hooks/usePublicProfile';
import { useAuth } from '../../hooks/useAuth';
import { useUserPosts, useUserProfile } from '../../hooks/useUserProfile';
import { findUserInCache, richerUser } from '../../hooks/userCache';
import type { UserLocationState } from '../../types';
import { dedupeById, isRecord } from '../../utils/normalize';

function isUserState(state: unknown, userId: string): state is UserLocationState {
  return isRecord(state) && isRecord(state.user) && state.user.id === userId;
}

function BackToFeed() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-1 text-sm font-semibold text-muted hover:text-ink">
      <FiArrowLeft aria-hidden /> Back to feed
    </Link>
  );
}

function PostsLoading({ label }: { label: string }) {
  return (
    <div className="space-y-4" role="status" aria-label={label}>
      <PostSkeleton />
      <PostSkeleton />
    </div>
  );
}

/** Posts from GET /users/:id/posts with pagination. */
function ApiPosts({ userId, name }: { userId: string; name: string }) {
  const query = useUserPosts(userId);
  const posts = useMemo(() => dedupeById(query.data?.pages.flatMap((page) => page.items) ?? []), [query.data]);

  if (query.isPending) return <PostsLoading label="Loading posts" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load posts"
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (posts.length === 0) {
    return <EmptyState icon={FiImage} title="No posts yet" description={`${name} hasn't published any posts.`} />;
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
        endLabel="No more posts"
      />
    </div>
  );
}

/** Fallback when the posts endpoint is unavailable: posts found by searching the feed. */
function ScannedPosts({ userId, name }: { userId: string; name: string }) {
  const scan = usePublicProfile(userId);

  return (
    <>
      <p className="mb-3 text-xs text-muted">
        The API can&apos;t list a user&apos;s posts, so these are found by searching the feed. This may not be their
        full history.
      </p>
      {scan.isLoading && <PostsLoading label="Searching the feed for posts" />}
      {scan.isError && (
        <ErrorState
          title="Couldn't search for posts"
          message={getErrorMessage(scan.error)}
          onRetry={() => void scan.refetch()}
        />
      )}
      {scan.isSuccess && scan.data.posts.length === 0 && (
        <EmptyState
          icon={FiImage}
          title="No posts found"
          description={`None of the ${scan.data.pagesScanned * SCAN_PAGE_SIZE} most recent feed posts were written by ${name}. Older posts may exist but can't be retrieved.`}
        />
      )}
      {scan.isSuccess && scan.data.posts.length > 0 && (
        <div className="space-y-4">
          {scan.data.posts.map((post, index) => (
            <Reveal key={post.id} index={index % 10}>
              <PostCard post={post} />
            </Reveal>
          ))}
          <p className="py-2 text-center text-xs text-muted">
            {scan.data.scanComplete
              ? 'Searched every post the feed returned.'
              : `Searched the ${scan.data.pagesScanned * SCAN_PAGE_SIZE} most recent feed posts. Older posts are not shown.`}
          </p>
        </div>
      )}
    </>
  );
}

export default function UserProfilePage() {
  const { userId = '' } = useParams();
  const { user: me } = useAuth();
  const location = useLocation();
  const qc = useQueryClient();

  const isSelf = Boolean(me?.id) && me?.id === userId;
  const state: unknown = location.state;
  const stateUser = isUserState(state, userId) ? state.user : undefined;

  // Preferred: the user-specific endpoints (unverified; a 404 means unsupported).
  const profile = useUserProfile(userId, !isSelf);
  const posts = useUserPosts(userId, !isSelf);
  const postsUnsupported = posts.isError && isNotFound(posts.error);
  const apiUser = profile.data ?? undefined;
  const profileUnavailable = profile.isError || (profile.isSuccess && !profile.data);

  // Fallback: documented endpoints only (feed scan + data already cached).
  const scan = usePublicProfile(userId, !isSelf && (profileUnavailable || postsUnsupported));
  const scannedUser = scan.data?.user;
  const knownUser = useMemo(
    () => richerUser(richerUser(stateUser, scannedUser), findUserInCache(qc, userId)),
    [qc, userId, stateUser, scannedUser],
  );
  const profileUser = apiUser ?? knownUser;

  // Your own profile lives at /profile (with photo upload and password change).
  if (isSelf) return <Navigate to="/profile" replace />;

  if (!profileUser && (profile.isPending || scan.isLoading)) {
    return (
      <div role="status" aria-label="Loading profile">
        <PageTitle title="Profile" />
        <BackToFeed />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="mt-6 space-y-4">
          <PostSkeleton />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    const failure = scan.isError ? scan.error : profile.isError && !isNotFound(profile.error) ? profile.error : null;
    return (
      <div>
        <PageTitle title="Profile" />
        <BackToFeed />
        {failure ? (
          <ErrorState
            title="Couldn't load this profile"
            message={getErrorMessage(failure)}
            onRetry={() => {
              void profile.refetch();
              void scan.refetch();
            }}
          />
        ) : (
          <EmptyState
            icon={FiUserX}
            title="Profile unavailable"
            description="This profile couldn't be loaded and the user doesn't appear in the recent feed. Open profiles from a post, comment, or like instead."
            action={
              <Link to="/">
                <Button>Back to home feed</Button>
              </Link>
            }
          />
        )}
      </div>
    );
  }

  const status: ProfileStatus = apiUser ? 'full' : profile.isPending ? 'loading' : 'partial';

  return (
    <div className="space-y-4">
      <PageTitle title={profileUser.username ?? profileUser.name} />
      <BackToFeed />
      <PublicProfileHeader key={profileUser.id} user={profileUser} status={status} />

      <div className="grid items-start gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-[4.5rem]">
          {status !== 'loading' && (
            // Private-looking fields are shown only from this user's own profile response, never from cached copies.
            <ProfileInfo user={profileUser} audience="public" available={status === 'full'} />
          )}
        </div>

        <section aria-labelledby="user-posts-heading" className="min-w-0">
          <h2 id="user-posts-heading" className="mb-3 text-[17px] font-semibold">
            Posts from {profileUser.name}
          </h2>
          {postsUnsupported ? (
            <ScannedPosts userId={userId} name={profileUser.name} />
          ) : (
            <ApiPosts userId={userId} name={profileUser.name} />
          )}
        </section>
      </div>
    </div>
  );
}
