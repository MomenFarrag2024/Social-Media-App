import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getErrorMessage } from '../../api/errors';
import { useImagePicker } from '../../hooks/useImagePicker';
import { useUpdatePost } from '../../hooks/usePosts';
import { postSchema, type PostValues } from '../../schemas/post.schema';
import type { Post } from '../../types';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { ImagePickerButton, ImagePreview } from '../common/ImagePickerButton';

export function EditPostDialog({ post, onClose }: { post: Post; onClose: () => void }) {
  const updatePost = useUpdatePost();
  const picker = useImagePicker();
  const [removeExisting, setRemoveExisting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PostValues>({ resolver: zodResolver(postSchema), defaultValues: { body: post.body } });

  const existingImage = post.image && !removeExisting && !picker.file ? post.image : null;
  const hasImage = Boolean(existingImage || picker.file);

  const onSubmit = handleSubmit(async (values) => {
    if (!values.body && !hasImage) {
      setError('body', { message: 'A post needs text or a photo' });
      return;
    }
    setFormError(null);
    try {
      await updatePost.mutateAsync({
        postId: post.id,
        body: values.body,
        image: picker.file,
        removeImage: removeExisting && !picker.file,
      });
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not update the post.'));
    }
  });

  const busy = updatePost.isPending;

  return (
    <Dialog title="Edit post" onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <div>
          <label htmlFor="edit-post-body" className="sr-only">
            Post text
          </label>
          <textarea
            id="edit-post-body"
            rows={4}
            disabled={busy}
            aria-invalid={errors.body ? true : undefined}
            className="w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-brand-from focus:outline-none focus:ring-2 focus:ring-brand-from/20"
            {...register('body')}
          />
          {errors.body && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {errors.body.message}
            </p>
          )}
        </div>

        {existingImage && (
          <ImagePreview url={existingImage} alt="Current post image" onRemove={() => setRemoveExisting(true)} disabled={busy} />
        )}
        {picker.previewUrl && (
          <ImagePreview url={picker.previewUrl} alt="New image preview" onRemove={picker.clear} disabled={busy} />
        )}
        {picker.error && (
          <p role="alert" className="text-xs text-danger">
            {picker.error}
          </p>
        )}
        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-between">
          <ImagePickerButton onSelect={picker.select} disabled={busy} label={hasImage ? 'Replace photo' : 'Add photo'} />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={busy}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
