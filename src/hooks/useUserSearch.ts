import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { User } from '../types';
import { useAuth } from './useAuth';
import { useSuggestions } from './usePosts';
import { collectUsersFromCache, richerUser } from './userCache';

/** Upper bound on matches kept in memory; they are shown SEARCH_PAGE_SIZE at a time. */
export const SEARCH_MAX_RESULTS = 120;
export const SEARCH_PAGE_SIZE = 6;

/**
 * The API has no user-search endpoint, so this searches people the app already knows: the suggestions
 * list plus authors seen in loaded posts, comments and likes. Matching is a case-insensitive substring
 * test on name and username. It cannot find people who haven't appeared in any of those. There is no
 * server-side search, so there is no search query to key or page on the server: matches are paged locally.
 */
export function useUserSearch(rawTerm: string) {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const suggestions = useSuggestions(30);
  const term = rawTerm.trim().toLowerCase();
  const suggestionItems = suggestions.data?.items;

  const results = useMemo<User[]>(() => {
    if (!term) return [];
    const pool = new Map<string, User>();
    for (const user of [...collectUsersFromCache(qc), ...(suggestionItems ?? [])]) {
      if (user.id) pool.set(user.id, richerUser(pool.get(user.id), user) ?? user);
    }
    return [...pool.values()]
      .filter(
        (user) =>
          user.id !== me?.id &&
          (user.name.toLowerCase().includes(term) || (user.username ?? '').toLowerCase().includes(term)),
      )
      .slice(0, SEARCH_MAX_RESULTS);
  }, [qc, term, suggestionItems, me?.id]);

  return {
    term,
    results,
    isLoading: suggestions.isPending,
    isError: suggestions.isError,
    error: suggestions.error,
    refetch: suggestions.refetch,
  };
}
