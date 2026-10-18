import { z } from 'zod';

/** Text is optional here because a post may consist of an image only; the form checks that. */
export const postSchema = z.object({
  body: z.string().trim(),
});
export type PostValues = z.infer<typeof postSchema>;

export const commentSchema = z.object({
  content: z.string().trim().min(1, 'Write something first'),
});
export type CommentValues = z.infer<typeof commentSchema>;

export const shareSchema = z.object({
  caption: z.string().trim(),
});
export type ShareValues = z.infer<typeof shareSchema>;
