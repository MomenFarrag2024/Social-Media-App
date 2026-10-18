import { useInfiniteQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  createComment,
  createReply,
  deleteComment,
  getComments,
  getReplies,
  toggleCommentLike,
  updateComment,
  type CommentInput,
} from '../api/comments.api';
import { getErrorMessage } from '../api/errors';
import type { Comment } from '../types';
import { mapItemInCache, restoreSnapshot, snapshotQueries, type Snapshot } from '../utils/cache';
import { withToggledLike } from '../utils/reactions';
import { patchPostEverywhere } from './postCache';
import { commentKeys } from './queryKeys';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: commentKeys.list(postId),
    queryFn: ({ pageParam }) => getComments(postId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
}

export function useReplies(postId: string, commentId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: commentKeys.replies(postId, commentId),
    queryFn: ({ pageParam }) => getReplies(postId, commentId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    enabled,
  });
}

function patchComment(qc: QueryClient, postId: string, commentId: string, patch: (comment: Comment) => Comment) {
  const updater = (old: unknown) => mapItemInCache<Comment>(old, commentId, patch);
  qc.setQueriesData<unknown>({ queryKey: commentKeys.list(postId) }, updater);
  qc.setQueriesData<unknown>({ queryKey: commentKeys.allReplies(postId) }, updater);
}

function snapshotComments(qc: QueryClient, postId: string): Snapshot {
  return [...snapshotQueries(qc, commentKeys.list(postId)), ...snapshotQueries(qc, commentKeys.allReplies(postId))];
}

/** Creates a comment, or a reply when `parentId` is given. */
export function useCreateComment(postId: string, parentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CommentInput) =>
      parentId ? createReply(postId, parentId, input) : createComment(postId, input),
    onSuccess: async () => {
      if (parentId) {
        patchComment(qc, postId, parentId, (c) => ({ ...c, repliesCount: (c.repliesCount ?? 0) + 1 }));
        await Promise.all([
          qc.invalidateQueries({ queryKey: commentKeys.replies(postId, parentId) }),
          qc.invalidateQueries({ queryKey: commentKeys.list(postId) }),
        ]);
      } else {
        patchPostEverywhere(qc, postId, (post) => ({ ...post, commentsCount: (post.commentsCount ?? 0) + 1 }));
        await qc.invalidateQueries({ queryKey: commentKeys.list(postId) });
      }
    },
  });
}

export function useUpdateComment(postId: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateComment(postId, commentId, content),
    onSuccess: async (_data, { commentId, content }) => {
      patchComment(qc, postId, commentId, (c) => ({ ...c, content }));
      await Promise.all([
        qc.invalidateQueries({ queryKey: commentKeys.list(postId) }),
        qc.invalidateQueries({ queryKey: commentKeys.allReplies(postId) }),
      ]);
      toast.push('Comment updated', 'success');
    },
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; parentId?: string }) => deleteComment(postId, commentId),
    onSuccess: async (_data, { parentId }) => {
      if (parentId) {
        patchComment(qc, postId, parentId, (c) => ({ ...c, repliesCount: Math.max(0, (c.repliesCount ?? 1) - 1) }));
        await Promise.all([
          qc.invalidateQueries({ queryKey: commentKeys.replies(postId, parentId) }),
          qc.invalidateQueries({ queryKey: commentKeys.list(postId) }),
        ]);
      } else {
        patchPostEverywhere(qc, postId, (post) => ({
          ...post,
          commentsCount: Math.max(0, (post.commentsCount ?? 1) - 1),
        }));
        await qc.invalidateQueries({ queryKey: commentKeys.list(postId) });
      }
      toast.push('Comment deleted', 'success');
    },
    onError: (error) => toast.push(getErrorMessage(error, 'Could not delete the comment.'), 'error'),
  });
}

export function useToggleCommentLike(postId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  return useMutation({
    mutationFn: (commentId: string) => toggleCommentLike(postId, commentId),
    onMutate: async (commentId) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: commentKeys.list(postId) }),
        qc.cancelQueries({ queryKey: commentKeys.allReplies(postId) }),
      ]);
      const snapshot = snapshotComments(qc, postId);
      patchComment(qc, postId, commentId, (c) => withToggledLike(c, user?.id));
      return { snapshot };
    },
    onError: (error, _commentId, context) => {
      if (context) restoreSnapshot(qc, context.snapshot);
      toast.push(getErrorMessage(error, 'Could not update your like.'), 'error');
    },
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: commentKeys.list(postId) }),
        qc.invalidateQueries({ queryKey: commentKeys.allReplies(postId) }),
      ]),
  });
}
