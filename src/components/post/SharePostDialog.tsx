import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getErrorMessage } from '../../api/errors';
import { useSharePost } from '../../hooks/usePosts';
import { shareSchema, type ShareValues } from '../../schemas/post.schema';
import type { Post } from '../../types';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';

/** Creates a share post on the backend (POST /posts/:id/share); not the browser's native share sheet. */
export function SharePostDialog({ post, onClose }: { post: Post; onClose: () => void }) {
  const share = useSharePost();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<ShareValues>({
    resolver: zodResolver(shareSchema),
    defaultValues: { caption: '' },
  });

  const onSubmit = handleSubmit(async ({ caption }) => {
    setFormError(null);
    try {
      await share.mutateAsync({ postId: post.id, caption: caption || undefined });
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not share this post.'));
    }
  });

  return (
    <Dialog title="Share to your profile" onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <div className="rounded-xl border border-line bg-soft p-3 text-sm">
          <p className="font-semibold">{post.author.name}</p>
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-muted">
            {post.body || 'Photo post'}
          </p>
        </div>
        <div>
          <label htmlFor="share-caption" className="sr-only">
            Add a caption (optional)
          </label>
          <textarea
            id="share-caption"
            rows={3}
            placeholder="Add a caption (optional)"
            disabled={share.isPending}
            className="w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-brand-from focus:outline-none focus:ring-2 focus:ring-brand-from/20"
            {...register('caption')}
          />
        </div>
        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={share.isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={share.isPending}>
            Share
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
