import type { ApiEnvelope, Comment, Page } from '../types';
import { api } from './axiosInstance';
import { normalizeComment, parsePage } from './normalizers';

export const COMMENTS_PAGE_SIZE = 10;

const COMMENT_KEYS = ['comments', 'replies', 'items'] as const;

// ASSUMPTION: the comment text field is named `content`.
const TEXT_FIELD = 'content';

export interface CommentInput {
  content: string;
  image?: File | null;
}

function toForm({ content, image }: CommentInput): FormData {
  const form = new FormData();
  form.append(TEXT_FIELD, content);
  if (image) form.append('image', image, image.name);
  return form;
}

export async function getComments(postId: string, page: number, limit = COMMENTS_PAGE_SIZE): Promise<Page<Comment>> {
  const { data } = await api.get<ApiEnvelope>(`/posts/${postId}/comments`, { params: { page, limit } });
  return parsePage(data, (raw) => normalizeComment(raw, postId), COMMENT_KEYS, page, limit);
}

export async function getReplies(
  postId: string,
  commentId: string,
  page: number,
  limit = COMMENTS_PAGE_SIZE,
): Promise<Page<Comment>> {
  const { data } = await api.get<ApiEnvelope>(`/posts/${postId}/comments/${commentId}/replies`, {
    params: { page, limit },
  });
  return parsePage(data, (raw) => normalizeComment(raw, postId), COMMENT_KEYS, page, limit);
}

export async function createComment(postId: string, input: CommentInput): Promise<void> {
  await api.post(`/posts/${postId}/comments`, toForm(input));
}

export async function createReply(postId: string, commentId: string, input: CommentInput): Promise<void> {
  await api.post(`/posts/${postId}/comments/${commentId}/replies`, toForm(input));
}

export async function updateComment(postId: string, commentId: string, content: string): Promise<void> {
  // ASSUMPTION: editing sends JSON { content } (text only).
  await api.put(`/posts/${postId}/comments/${commentId}`, { [TEXT_FIELD]: content });
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await api.delete(`/posts/${postId}/comments/${commentId}`);
}

export async function toggleCommentLike(postId: string, commentId: string): Promise<void> {
  await api.put(`/posts/${postId}/comments/${commentId}/like`);
}
