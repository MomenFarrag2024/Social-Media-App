import { useInfiniteQuery, useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ApiError, getErrorMessage } from '../api/errors';
import {
  createPost,
  deletePost,
  getBookmarks,
  getFeed,
  getPostLikes,
  sharePost,
  togglePostBookmark,
  togglePostLike,
  updatePost,
  type CreatePostInput,
  type UpdatePostInput,
} from '../api/posts.api';
import { getSuggestions, isNotFound } from '../api/users.api';
import type { FeedFilter, Post } from '../types';
import { restoreSnapshot, snapshotQueries } from '../utils/cache';
import { isBookmarkedBy, withToggledBookmark, withToggledLike } from '../utils/reactions';
import { findPostInCache, patchPostEverywhere, removePostEverywhere } from './postCache';
import { authKeys, isRefetchablePostKey, postKeys, userKeys } from './queryKeys';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export function useFeed(only: FeedFilter) {
  return useInfiniteQuery({
    queryKey: postKeys.feed(only),
    queryFn: ({ pageParam }) => getFeed(only, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
}

export function useBookmarks() {
  return useInfiniteQuery({
    queryKey: postKeys.bookmarks,
    queryFn: ({ pageParam }) => getBookmarks(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
}

export function usePostLikes(postId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: postKeys.likes(postId),
    queryFn: ({ pageParam }) => getPostLikes(postId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    enabled,
  });
}

/**
 * One page of GET /users/suggestions?page=&limit=. The page is part of the query key, so each page is
 * fetched and cached separately; the previous page stays on screen (flagged `isPlaceholderData`) while the
 * next one loads. Follow mutations invalidate the shared `userKeys.suggestions` prefix, covering every page.
 */
export function useSuggestions(limit = 6, page = 1) {
  return useQuery({
    queryKey: [...userKeys.suggestions, page, limit],
    queryFn: () => getSuggestions(page, limit),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

function useRefetchPosts() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: postKeys.all, predicate: (q) => isRefetchablePostKey(q.queryKey) });
}

export function useCreatePost() {
  const toast = useToast();
  const refetchPosts = useRefetchPosts();
  return useMutation({
    mutationFn: (input: CreatePostInput) => createPost(input),
    onSuccess: async () => {
      await refetchPosts();
      toast.push('Post published', 'success');
    },
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  const toast = useToast();
  const refetchPosts = useRefetchPosts();
  return useMutation({
    mutationFn: (input: UpdatePostInput) => updatePost(input),
    onSuccess: async (_data, input) => {
      await refetchPosts();
      // Re-seed the single-post query from the freshly refetched lists when possible.
      const fresh = findPostInCache(qc, input.postId);
      if (fresh) qc.setQueryData(postKeys.detail(input.postId), fresh);
      else patchPostEverywhere(qc, input.postId, (post) => ({ ...post, body: input.body }));
      toast.push('Post updated', 'success');
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  const toast = useToast();
  const refetchPosts = useRefetchPosts();
  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    // The post is only removed from the UI after the server confirms; failures leave everything as it was.
    onSuccess: async (_data, postId) => {
      removePostEverywhere(qc, postId);
      toast.push('Post deleted', 'success');
      await Promise.all([refetchPosts(), qc.invalidateQueries({ queryKey: authKeys.profile })]);
    },
    // On any failure the post stays visible and nothing is reported as deleted.
    onError: (error) => {
      let message: string;
      if (isNotFound(error)) message = 'This post could not be found. It may already have been deleted.';
      else if (error instanceof ApiError && error.status === 403) message = 'You can only delete your own posts.';
      else message = getErrorMessage(error, 'Could not delete the post. Please try again.');
      toast.push(message, 'error');
    },
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const refetchPosts = useRefetchPosts();
  return useMutation({
    mutationFn: (postId: string) => togglePostLike(postId),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: postKeys.all });
      const snapshot = snapshotQueries(qc, postKeys.all);
      patchPostEverywhere(qc, postId, (post) => withToggledLike(post, user?.id));
      return { snapshot };
    },
    onError: (error, _postId, context) => {
      if (context) restoreSnapshot(qc, context.snapshot);
      toast.push(getErrorMessage(error, 'Could not update your like.'), 'error');
    },
    onSettled: () => refetchPosts(),
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  return useMutation({
    mutationFn: (post: Post) => togglePostBookmark(post.id),
    onMutate: async (post) => {
      await qc.cancelQueries({ queryKey: postKeys.all });
      const snapshot = snapshotQueries(qc, postKeys.all);
      patchPostEverywhere(qc, post.id, (current) => withToggledBookmark(current, user?.id));
      return { snapshot };
    },
    onSuccess: (_data, post) => {
      toast.push(isBookmarkedBy(post, user?.id) ? 'Removed from bookmarks' : 'Saved to bookmarks', 'success');
    },
    onError: (error, _post, context) => {
      if (context) restoreSnapshot(qc, context.snapshot);
      toast.push(getErrorMessage(error, 'Could not update your bookmark.'), 'error');
    },
  });
}

export function useSharePost() {
  const qc = useQueryClient();
  const toast = useToast();
  const refetchPosts = useRefetchPosts();
  return useMutation({
    mutationFn: ({ postId, caption }: { postId: string; caption?: string }) => sharePost(postId, caption),
    onSuccess: async (_data, { postId }) => {
      patchPostEverywhere(qc, postId, (post) => ({ ...post, sharesCount: (post.sharesCount ?? 0) + 1 }));
      await refetchPosts();
      toast.push('Post shared to your profile', 'success');
    },
  });
}
