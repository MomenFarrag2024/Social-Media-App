import { useState } from 'react';
import { getErrorMessage } from '../../api/errors';
import { useImagePicker } from '../../hooks/useImagePicker';
import { useUploadCover } from '../../hooks/useProfile';
import type { User } from '../../types';
import { Button } from '../common/Button';
import { CameraButton } from '../common/CameraButton';
import { ProfileCover } from './ProfileCover';

/**
 * Cover photo settings: choose an image, preview it, then upload it (PUT /users/upload-cover, multipart).
 * Profile photos use their own, separate upload.
 */
export function CoverPhotoSection({ user }: { user: User }) {
  const picker = useImagePicker();
  const upload = useUploadCover();
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!picker.file || upload.isPending) return;
    setError(null);
    try {
      await upload.mutateAsync(picker.file);
      picker.clear();
    } catch (caught) {
      setError(getErrorMessage(caught, 'Could not upload your cover photo.'));
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl">
        <ProfileCover src={picker.previewUrl ?? user.cover} viewable={false} size="compact" />
        <CameraButton
          label="Choose cover photo"
          disabled={upload.isPending}
          onSelect={picker.select}
          className="absolute bottom-3 right-3"
        />
      </div>

      {picker.file && <p className="text-xs text-muted">Previewing {picker.file.name}. Save to use it as your cover.</p>}
      {(picker.error || error) && (
        <p role="alert" className="text-xs text-danger">
          {picker.error ?? error}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" disabled={!picker.file} loading={upload.isPending} onClick={() => void save()}>
          Save cover photo
        </Button>
        {picker.file && (
          <Button size="sm" variant="ghost" disabled={upload.isPending} onClick={picker.clear}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
