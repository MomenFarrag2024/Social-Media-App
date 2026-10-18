import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getErrorMessage } from '../../api/errors';
import { useAuth } from '../../hooks/useAuth';
import { useImagePicker } from '../../hooks/useImagePicker';
import { useCreatePost } from '../../hooks/usePosts';
import { postSchema, type PostValues } from '../../schemas/post.schema';
import { Avatar } from '../common/Avatar';
import { UserLink } from '../common/UserLink';
import { Button } from '../common/Button';
import { ImagePickerButton, ImagePreview } from '../common/ImagePickerButton';

export function PostComposer() {
  const { user } = useAuth();
  const createPost = useCreatePost();
  const picker = useImagePicker();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<PostValues>({ resolver: zodResolver(postSchema), defaultValues: { body: '' } });

  const hasContent = watch('body').trim().length > 0 || picker.file !== null;

  const cancel = () => {
    reset();
    picker.clear();
    setFormError(null);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!values.body && !picker.file) {
      setError('body', { message: 'Write something or add a photo' });
      return;
    }
    setFormError(null);
    try {
      await createPost.mutateAsync({ body: values.body, image: picker.file });
      reset();
      picker.clear();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not publish your post.'));
    }
  });

  const busy = createPost.isPending;

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-card border border-line bg-surface p-3 shadow-card sm:p-4" aria-label="Create a post">
      <div className="flex gap-3">
        {user && (
          <UserLink user={user} ariaLabel="Your profile">
            <Avatar user={user} />
          </UserLink>
        )}
        <div className="min-w-0 flex-1">
          <label htmlFor="post-body" className="sr-only">
            What&apos;s on your mind?
          </label>
          <textarea
            id="post-body"
            rows={2}
            placeholder={`What's on your mind${user ? `, ${user.name.split(' ')[0]}` : ''}?`}
            disabled={busy}
            aria-invalid={errors.body ? true : undefined}
            className="w-full resize-none rounded-2xl bg-soft px-4 py-2.5 text-[15px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-from/40 disabled:opacity-60"
            {...register('body')}
          />
          {errors.body && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {errors.body.message}
            </p>
          )}
        </div>
      </div>

      {picker.previewUrl && (
        <div className="mt-3 sm:pl-14">
          <ImagePreview url={picker.previewUrl} alt="Selected image preview" onRemove={picker.clear} disabled={busy} />
        </div>
      )}
      {picker.error && (
        <p role="alert" className="mt-2 text-xs text-danger sm:pl-14">
          {picker.error}
        </p>
      )}
      {formError && (
        <p role="alert" className="mt-2 text-sm text-danger sm:pl-14">
          {formError}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <ImagePickerButton onSelect={picker.select} disabled={busy} label="Photo" />
        <div className="flex items-center gap-2">
          {hasContent && (
            <Button variant="ghost" size="sm" onClick={cancel} disabled={busy}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" loading={busy} disabled={!hasContent}>
            Post
          </Button>
        </div>
      </div>
    </form>
  );
}
