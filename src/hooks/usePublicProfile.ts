import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getFeed } from '../api/posts.api';
import type { Post, User } from '../types';
import { postKeys } from './queryKeys';
import { findPostsByAuthorInCache, findUserInCache, richerUser } from './userCache';

/** How much of the feed is searched for a user's posts: SCAN_PAGES pages of SCAN_PAGE_SIZE posts. */
export const SCAN_PAGES = 5;
export const SCAN_PAGE_SIZE = 20;

export interface PublicProfileData {
  /** Best copy of the user found in cached data or in scanned posts; undefined when never seen. */
  user?: User;
  /** Posts by this user found in the cache and the scanned feed pages (NOT a complete history). */
  posts: Post[];
  pagesScanned: number;
  /** True when the scan reached the last feed page, so every post the feed returns was checked. */
  scanComplete: boolean;
}

function newestFirst(a: Post, b: Post): number {
  return (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0);
}

/**
 * The API has no endpoint for another user's profile or posts. This reuses only documented data:
 * authors already cached from feeds/comments/likes/suggestions, plus a bounded scan of
 * GET /posts/feed?only=all filtered on the client by author id.
 */
async function scanForUser(qc: QueryClient, userId: string): Promise<PublicProfileData> {
  const posts = new Map<string, Post>();
  let user = findUserInCache(qc, userId);
  for (const post of findPostsByAuthorInCache(qc, userId)) posts.set(post.id, post);

  let page = 1;
  let pagesScanned = 0;
  let scanComplete = false;
  while (pagesScanned < SCAN_PAGES) {
    const result = await getFeed('all', page, SCAN_PAGE_SIZE);
    pagesScanned += 1;
    for (const post of result.items) {
      if (post.author.id !== userId) continue;
      posts.set(post.id, post); // fresher than any cached copy
      user = richerUser(user, post.author);
    }
    if (result.nextPage === null || result.nextPage <= page) {
      scanComplete = true;
      break;
    }
    page = result.nextPage;
  }

  return { user, posts: [...posts.values()].sort(newestFirst), pagesScanned, scanComplete };
}

export function usePublicProfile(userId: string, enabled = true) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: postKeys.authorScan(userId),
    queryFn: () => scanForUser(qc, userId),
    enabled: enabled && Boolean(userId),
    staleTime: 60_000,
    retry: false,
  });
}
