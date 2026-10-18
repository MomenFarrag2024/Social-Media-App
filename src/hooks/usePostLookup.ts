import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { PostNotFoundError } from '../api/errors';
import { getFeed, getPostById, getPosts } from '../api/posts.api';
import type { Page, Post } from '../types';
import { findPostInCache } from './postCache';
import { postKeys } from './queryKeys';

const LOOKUP_PAGES = 2;
const LOOKUP_PAGE_SIZE = 20;

/**
 * Resolution order for opening a post by id (direct links, refreshes):
 *   1. router state (passed in as `statePost`) and cached feed/list pages,
 *   2. GET /posts/:id (not in the official table; used by other clients of this API, unverified here),
 *   3. a small bounded scan of the documented list endpoints, in case (2) is unavailable,
 *   4. otherwise PostNotFoundError (deleted post, invalid id; the page shows a fallback with a link home).
 * Network/server errors from (2) propagate so the page can offer a retry instead of claiming "not found".
 */
async function findPost(qc: QueryClient, postId: string): Promise<Post> {
  const cached = findPostInCache(qc, postId);
  if (cached) return cached;

  const direct = await getPostById(postId);
  if (direct) return direct;

  const sources: Array<(page: number) => Promise<Page<Post>>> = [
    (page) => getFeed('all', page, LOOKUP_PAGE_SIZE),
    (page) => getPosts(page, LOOKUP_PAGE_SIZE),
  ];

  for (const fetchPage of sources) {
    let page = 1;
    for (let attempt = 0; attempt < LOOKUP_PAGES; attempt++) {
      const result = await fetchPage(page);
      const hit = result.items.find((post) => post.id === postId);
      if (hit) return hit;
      if (result.nextPage === null || result.nextPage <= page) break;
      page = result.nextPage;
    }
  }
  throw new PostNotFoundError();
}

export function usePostLookup(postId: string, statePost?: Post) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => findPost(qc, postId),
    initialData: () => statePost ?? findPostInCache(qc, postId),
    staleTime: Infinity,
    retry: false,
  });
}
