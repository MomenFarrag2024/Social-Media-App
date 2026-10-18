import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getUserProfile } from '../api/users.api';
import type { User } from '../types';
import { userKeys } from './queryKeys';
import { findUserInCache } from './userCache';

export const USER_LIST_PAGE_SIZE = 10;

/**
 * Resolves a list of user ids (e.g. the `following` ids from your own profile) into displayable users,
 * a page at a time. Each row comes from GET /users/:id/profile (unverified endpoint); when that is
 * unavailable for a user, a copy already seen in posts/comments is used. Unresolvable ids are counted,
 * never shown as made-up users.
 */
export function useUserListByIds(ids: string[], enabled: boolean) {
  const qc = useQueryClient();
  const [pageCount, setPageCount] = useState(1);
  const visibleIds = enabled ? ids.slice(0, pageCount * USER_LIST_PAGE_SIZE) : [];

  const results = useQueries({
    queries: visibleIds.map((id) => ({
      queryKey: userKeys.listItem(id),
      queryFn: async (): Promise<User | null> => (await getUserProfile(id)) ?? findUserInCache(qc, id) ?? null,
      staleTime: 60_000,
      retry: false,
    })),
  });

  const users = results.map((result) => result.data).filter((user): user is User => Boolean(user));
  const loading = results.some((result) => result.isLoading);
  const failed = results.filter((result) => result.isError).length;
  const unresolved = failed + results.filter((result) => result.isSuccess && !result.data).length;

  return {
    users,
    isLoading: loading,
    /** Every row failed (e.g. a network problem), as opposed to a few unresolved ids. */
    isError: results.length > 0 && failed === results.length,
    unresolved,
    hasMore: enabled && visibleIds.length < ids.length,
    loadMore: () => setPageCount((count) => count + 1),
    retry: () => {
      for (const result of results) if (result.isError) void result.refetch();
    },
  };
}
