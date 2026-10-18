import { useState } from 'react';
import { getErrorMessage } from '../../api/errors';
import { useUploadPhoto } from '../../hooks/useProfile';
import { useToast } from '../../hooks/useToast';
import type { User } from '../../types';
import { validateImage } from '../../utils/image';
import { Avatar } from '../common/Avatar';
import { CameraButton } from '../common/CameraButton';
import { ImageViewerButton } from '../common/ImageLightbox';
import { Spinner } from '../common/Spinner';

/**
 * The profile picture with a working camera button: picking a file uploads it straight away through the
 * shared upload mutation (same one Settings uses), which updates the cached profile on success.
 */
export function ProfileAvatar({ user }: { user: User }) {
  const upload = useUploadPhoto();
  const toast = useToast();
  const [flash, setFlash] = useState(0); // bumps after a successful upload to replay the ring

  const onSelect = async (file: File | undefined) => {
    if (!file || upload.isPending) return;
    const problem = validateImage(file);
    if (problem) {
      toast.push(problem, 'error');
      return;
    }
    try {
      await upload.mutateAsync(file); // success toast and cache update live in useUploadPhoto
      setFlash((count) => count + 1);
    } catch (error) {
      toast.push(getErrorMessage(error, 'Could not upload your photo.'), 'error');
    }
  };

  return (
    <div className="relative inline-block">
      <ImageViewerButton
        src={user.photo}
        alt={`${user.name}'s profile photo`}
        label="View profile photo"
        className="rounded-full transition-transform duration-200 hover:scale-[1.03]"
      >
        <Avatar user={user} size="2xl" />
      </ImageViewerButton>
      <span
        key={flash}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-full ${flash > 0 ? 'animate-success-ring' : ''}`}
      />
      {upload.isPending && (
        <span
          role="status"
          aria-label="Uploading photo"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white"
        >
          <Spinner className="h-7 w-7" />
        </span>
      )}
      <CameraButton
        label="Change profile photo"
        disabled={upload.isPending}
        onSelect={(file) => void onSelect(file)}
        className="absolute bottom-1 right-1"
      />
    </div>
  );
}
