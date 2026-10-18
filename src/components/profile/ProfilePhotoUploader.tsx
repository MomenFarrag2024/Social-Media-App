import { useState } from 'react';
import { getErrorMessage } from '../../api/errors';
import { useImagePicker } from '../../hooks/useImagePicker';
import { useUploadPhoto } from '../../hooks/useProfile';
import type { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { ImagePickerButton } from '../common/ImagePickerButton';

/** Settings: choose, preview and upload a new profile photo (same upload mutation as the camera button). */
export function ProfilePhotoUploader({ user }: { user: User }) {
  const picker = useImagePicker();
  const upload = useUploadPhoto();
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!picker.file) return;
    setError(null);
    try {
      await upload.mutateAsync(picker.file);
      picker.clear();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload your photo.'));
    }
  };

  const preview = picker.previewUrl ? { ...user, photo: picker.previewUrl } : user;

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <Avatar user={preview} size="xl" />
      <div className="space-y-2">
        {picker.file ? (
          <div className="flex gap-2">
            <Button size="sm" loading={upload.isPending} onClick={() => void save()}>
              Save photo
            </Button>
            <Button size="sm" variant="ghost" disabled={upload.isPending} onClick={picker.clear}>
              Cancel
            </Button>
          </div>
        ) : (
          <ImagePickerButton onSelect={picker.select} disabled={upload.isPending} label="Choose a new photo" />
        )}
        {picker.file && <p className="text-xs text-muted">Previewing {picker.file.name}. Save to apply it.</p>}
        {(picker.error || error) && (
          <p role="alert" className="text-xs text-danger">
            {picker.error ?? error}
          </p>
        )}
      </div>
    </div>
  );
}
