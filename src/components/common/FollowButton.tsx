import { useState } from 'react';
import { getErrorMessage } from '../../api/errors';
import { useFollowPending, useFollowUser, useIsFollowing } from '../../hooks/useFollow';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Follow / Following toggle shared by posts, profiles, suggestions, likes and follower lists.
 * Following someone is immediate; unfollowing asks for confirmation first. Hidden for the signed-in user
 * and whenever the current follow state is unknown.
 */
export function FollowButton({ user, className = '' }: { user: User; className?: string }) {
  const { user: me } = useAuth();
  const following = useIsFollowing(user);
  const follow = useFollowUser(user);
  const pending = useFollowPending(user.id);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!me || !user.id || user.id === me.id || following === undefined) return null;

  const handle = user.username ? `@${user.username}` : user.name;

  const unfollow = async () => {
    if (pending) return; // no duplicate submissions
    setError(null);
    try {
      // Caches and the UI are updated by the mutation only after the server confirms.
      await follow.mutateAsync({ wasFollowing: true });
      setConfirming(false);
    } catch (caught) {
      setError(getErrorMessage(caught, 'Could not unfollow. Please try again.'));
    }
  };

  return (
    <>
      <Button
        size="xs"
        variant={following ? 'secondary' : 'primary'}
        className={`shrink-0 ${className}`}
        loading={pending && !confirming}
        aria-pressed={following}
        aria-label={`${following ? 'Unfollow' : 'Follow'} ${user.name}`}
        onClick={() => {
          if (pending) return;
          if (following) {
            setError(null);
            setConfirming(true); // nothing is sent until the user confirms
          } else {
            follow.mutate({ wasFollowing: false });
          }
        }}
      >
        {following ? 'Following' : 'Follow'}
      </Button>
      {confirming && (
        <ConfirmDialog
          title="Unfollow User?"
          description={`Are you sure you want to unfollow ${handle}?`}
          confirmLabel="Unfollow"
          variant="primary"
          loading={pending}
          error={error}
          onConfirm={() => void unfollow()}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  );
}
