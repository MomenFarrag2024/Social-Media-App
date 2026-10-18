import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../api/errors';
import { followUser } from '../api/users.api';
import type { User } from '../types';
import { authKeys, postKeys, userKeys } from './queryKeys';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

/**
 * Whether the signed-in user follows `target`: taken from the signed-in user's own `following` ids when
 * the profile payload has them, else from a direct flag on the target. `undefined` means unknown, in
 * which case no Follow button is shown (the API endpoint is a toggle, so guessing could unfollow).
 */
export function useIsFollowing(target: User): boolean | undefined {
  const { user: me } = useAuth();
  if (me?.followingIds) return me.followingIds.includes(target.id);
  return target.isFollowing;
}

/** True while any follow request for this user is in flight, across every button on screen. */
export function useFollowPending(userId: string): boolean {
  return useIsMutating({ mutationKey: userKeys.follow(userId) }) > 0;
}

export function useFollowUser(target: User) {
  const qc = useQueryClient();
  const toast = useToast();
  const label = target.username ? `@${target.username}` : target.name;

  return useMutation({
    mutationKey: userKeys.follow(target.id),
    mutationFn: (_current: { wasFollowing: boolean }) => followUser(target.id),
    // Nothing is changed locally until the server confirms, so a failure never leaves a wrong state.
    onSuccess: async (_data, { wasFollowing }) => {
      const delta = wasFollowing ? -1 : 1;

      qc.setQueryData<User>(authKeys.profile, (me) => {
        if (!me?.followingIds) return me;
        return {
          ...me,
          followingIds: wasFollowing
            ? me.followingIds.filter((id) => id !== target.id)
            : [...me.followingIds, target.id],
          stats: {
            ...me.stats,
            following: me.stats.following === undefined ? undefined : Math.max(0, me.stats.following + delta),
          },
        };
      });
      qc.setQueryData<User | null>(userKeys.profile(target.id), (old) =>
        old
          ? {
              ...old,
              isFollowing: !wasFollowing,
              stats: {
                ...old.stats,
                followers: old.stats.followers === undefined ? undefined : Math.max(0, old.stats.followers + delta),
              },
            }
          : old,
      );

      toast.push(wasFollowing ? `Unfollowed ${label}` : `You're now following ${label}`, 'success');

      // Re-read server truth for everything a follow change can affect.
      await Promise.all([
        qc.invalidateQueries({ queryKey: authKeys.profile }),
        qc.invalidateQueries({ queryKey: userKeys.profile(target.id) }),
        qc.invalidateQueries({ queryKey: userKeys.suggestions }),
        qc.invalidateQueries({ queryKey: postKeys.feed('following') }),
      ]);
    },
    onError: (error) => {
      toast.push(getErrorMessage(error, 'Could not update follow status. Please try again.'), 'error');
    },
  });
}
