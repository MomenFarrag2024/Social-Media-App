import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiSend } from 'react-icons/fi';
import { getErrorMessage } from '../../api/errors';
import { useImagePicker } from '../../hooks/useImagePicker';
import { commentSchema, type CommentValues } from '../../schemas/post.schema';
import { Button } from '../common/Button';
import { ImagePickerButton, ImagePreview } from '../common/ImagePickerButton';

interface CommentFormProps {
  onSubmit: (values: { content: string; image: File | null }) => Promise<unknown>;
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
  /** Image attachments are only offered where the endpoint accepts them (create comment / reply). */
  allowImage?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  label?: string;
}

export function CommentForm({
  onSubmit,
  placeholder = 'Add a comment…',
  submitLabel,
  initialValue = '',
  allowImage = false,
  autoFocus = false,
  onCancel,
  label = 'Comment',
}: CommentFormProps) {
  const fieldId = useId();
  const picker = useImagePicker();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentValues>({ resolver: zodResolver(commentSchema), defaultValues: { content: initialValue } });

  const submit = handleSubmit(async ({ content }) => {
    setFormError(null);
    try {
      await onSubmit({ content, image: picker.file });
      reset({ content: '' });
      picker.clear();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not send your comment.'));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={fieldId}>
            {label}
          </label>
          <textarea
            id={fieldId}
            rows={1}
            autoFocus={autoFocus}
            placeholder={placeholder}
            disabled={isSubmitting}
            aria-invalid={errors.content ? true : undefined}
            className="max-h-32 min-h-10 w-full resize-y rounded-2xl bg-soft px-3.5 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-from/30 disabled:opacity-60"
            {...register('content')}
          />
        </div>
        {allowImage && <ImagePickerButton onSelect={picker.select} disabled={isSubmitting} label="" />}
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" loading={isSubmitting} aria-label={submitLabel ?? 'Send comment'}>
          {submitLabel ?? <FiSend aria-hidden />}
        </Button>
      </div>
      {errors.content && (
        <p role="alert" className="text-xs text-danger">
          {errors.content.message}
        </p>
      )}
      {picker.previewUrl && (
        <div className="max-w-xs">
          <ImagePreview url={picker.previewUrl} alt="Selected comment image" onRemove={picker.clear} />
        </div>
      )}
      {picker.error && (
        <p role="alert" className="text-xs text-danger">
          {picker.error}
        </p>
      )}
      {formError && (
        <p role="alert" className="text-xs text-danger">
          {formError}
        </p>
      )}
    </form>
  );
}
