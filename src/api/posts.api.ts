import type { ApiEnvelope, FeedFilter, Page, Post, User } from '../types';
import { api } from './axiosInstance';
import { isRecord, pick } from '../utils/normalize';
import { ApiError } from './errors';
import { normalizePost, normalizeUser, parsePage } from './normalizers';

export const PAGE_SIZE = 10;

const POST_LIST_KEYS = ['posts', 'feed', 'items'] as const;

export async function getFeed(only: FeedFilter, page: number, limit = PAGE_SIZE): Promise<Page<Post>> {
  // ASSUMPTION: `only` accepts "all", "following" and "me" (as listed in the docs).
  const { data } = await api.get<ApiEnvelope>('/posts/feed', { params: { only, page, limit } });
  return parsePage(data, (raw) => normalizePost(raw), POST_LIST_KEYS, page, limit);
}

export async function getPosts(page: number, limit = PAGE_SIZE): Promise<Page<Post>> {
  const { data } = await api.get<ApiEnvelope>('/posts', { params: { page, limit } });
  return parsePage(data, (raw) => normalizePost(raw), POST_LIST_KEYS, page, limit);
}

export interface CreatePostInput {
  body: string;
  image?: File | null;
}

/**
 * POST /posts as multipart/form-data. The server rejects an empty `body` ("body" is not allowed to be empty),
 * so `body` is sent only when there is text; an image-only post sends just `image`. A post with neither is
 * refused here (the composer already blocks it) instead of being sent with filler text.
 */
export async function createPost({ body, image }: CreatePostInput): Promise<void> {
  const text = body.trim();
  if (!text && !image) throw new Error('A post needs some text or an image.');
  const form = new FormData();
  if (text) form.append('body', text); // documented field name
  if (image) form.append('image', image, image.name); // the real File object
  await api.post('/posts', form);
}

export interface UpdatePostInput {
  postId: string;
  body: string;
  image?: File | null;
  removeImage?: boolean;
}

// ASSUMPTION: the docs say the update endpoint can "remove image" but not how.
// A `removeImage=true` form field is sent; verify and adjust here if the API differs.
const REMOVE_IMAGE_FIELD = 'removeImage';

export async function updatePost({ postId, body, image, removeImage }: UpdatePostInput): Promise<void> {
  const form = new FormData();
  form.append('body', body);
  if (image) form.append('image', image, image.name);
  else if (removeImage) form.append(REMOVE_IMAGE_FIELD, 'true');
  await api.put(`/posts/${postId}`, form);
}

export async function togglePostLike(postId: string): Promise<void> {
  await api.put(`/posts/${postId}/like`);
}

export async function togglePostBookmark(postId: string): Promise<void> {
  await api.put(`/posts/${postId}/bookmark`);
}

export async function sharePost(postId: string, caption?: string): Promise<void> {
  // ASSUMPTION: the share endpoint accepts an optional `body` caption.
  await api.post(`/posts/${postId}/share`, caption ? { body: caption } : {});
}

export async function getPostLikes(postId: string, page: number, limit = 20): Promise<Page<User>> {
  const { data } = await api.get<ApiEnvelope>(`/posts/${postId}/likes`, { params: { page, limit } });
  return parsePage(data, normalizeUser, ['likes', 'users'], page, limit);
}

/**
 * DELETE /posts/:postId (Bearer token added by the shared Axios instance). The API returns no body, so any
 * 2xx response is success and nothing is read from it. The id is required: a bare `DELETE /posts/` is never sent.
 */
export async function deletePost(postId: string): Promise<void> {
  if (!postId.trim()) throw new Error('Cannot delete a post without its id.');
  await api.delete(`/posts/${encodeURIComponent(postId)}`);
}

/**
 * GET /posts/:postId. Not in the official endpoint table; it is used by other clients of this API
 * (unverified here). Resolves to null for 400/404/422 (deleted post, invalid id, or endpoint absent).
 */
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const { data } = await api.get<ApiEnvelope>(`/posts/${encodeURIComponent(postId)}`);
    const payload = data.data;
    return normalizePost(isRecord(payload) ? (pick(payload, ['post']) ?? payload) : payload);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400 || error.status === 422)) {
      return null;
    }
    throw error;
  }
}

/**
 * GET /users/bookmarks: the signed-in user's saved posts. Not in the official endpoint table; documented
 * by another client of this API (unverified here). Entries may be posts or `{ post }` wrappers. Paging
 * parameters are sent only for page 2+ and a next page is assumed only when the response's meta says so.
 */
export async function getBookmarks(page: number): Promise<Page<Post>> {
  const { data } = await api.get<ApiEnvelope>('/users/bookmarks', page > 1 ? { params: { page } } : undefined);
  return parsePage(
    data,
    (raw) => {
      const post = normalizePost(isRecord(raw) && isRecord(raw.post) ? raw.post : raw);
      // Everything in the saved list is bookmarked by definition, even if the item carries no flag.
      return post ? { ...post, isBookmarked: post.isBookmarked ?? true } : null;
    },
    ['bookmarks', 'posts', 'items'],
    page,
    Number.MAX_SAFE_INTEGER,
  );
}
