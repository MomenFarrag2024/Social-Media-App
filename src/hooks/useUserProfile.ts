import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getUserPosts, getUserProfile } from '../api/users.api';
import { postKeys, userKeys } from './queryKeys';

/** GET /users/:id/profile (unverified endpoint). Data is null when the API answers 404. */
export function useUserProfile(userId: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: () => getUserProfile(userId),
    enabled: enabled && Boolean(userId),
    staleTime: 30_000,
    retry: false,
  });
}

/** GET /users/:id/posts (unverified endpoint). A 404 error means "unsupported": callers fall back to a feed scan. */
export function useUserPosts(userId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: postKeys.byUser(userId),
    queryFn: ({ pageParam }) => getUserPosts(userId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    enabled: enabled && Boolean(userId),
    staleTime: 30_000,
    retry: false,
  });
}
