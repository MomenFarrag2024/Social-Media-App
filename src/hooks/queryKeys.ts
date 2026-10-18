import type { FeedFilter } from '../types';

export const authKeys = {
  profile: ['auth', 'profile'] as const,
};

export const postKeys = {
  all: ['posts'] as const,
  feed: (only: FeedFilter) => ['posts', 'feed', only] as const,
  list: ['posts', 'list'] as const,
  /** The signed-in user's saved posts (GET /users/bookmarks). */
  bookmarks: ['posts', 'bookmarks'] as const,
  detail: (postId: string) => ['posts', 'detail', postId] as const,
  likes: (postId: string) => ['posts', 'likes', postId] as const,
  /** Client-side scan of the feed for one author's posts (the API has no per-user posts endpoint). */
  /** Posts from GET /users/:id/posts (when that endpoint exists). */
  byUser: (userId: string) => ['posts', 'user', userId] as const,
  authorScan: (userId: string) => ['posts', 'author-scan', userId] as const,
};

export const commentKeys = {
  list: (postId: string) => ['comments', postId] as const,
  replies: (postId: string, commentId: string) => ['replies', postId, commentId] as const,
  allReplies: (postId: string) => ['replies', postId] as const,
};

export const notificationKeys = {
  list: ['notifications', 'list'] as const,
  unread: ['notifications', 'unread-count'] as const,
};

export const userKeys = {
  suggestions: ['users', 'suggestions'] as const,
  profile: (userId: string) => ['users', 'profile', userId] as const,
  /** One resolved row of a follower/following list. */
  listItem: (userId: string) => ['users', 'list-item', userId] as const,
  follow: (userId: string) => ['users', 'follow', userId] as const,
};

/** Queries whose data is a collection or a single post object (patched by optimistic updates). */
export function isPostDataKey(key: readonly unknown[]): boolean {
  return key[1] === 'feed' || key[1] === 'list' || key[1] === 'detail' || key[1] === 'author-scan' || key[1] === 'user' || key[1] === 'bookmarks';
}

/** Post queries worth refetching after a mutation (single-post lookups and author scans are patched locally instead). */
export function isRefetchablePostKey(key: readonly unknown[]): boolean {
  return key[1] !== 'detail' && key[1] !== 'author-scan';
}
