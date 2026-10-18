import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changePassword, type ChangePasswordPayload } from '../api/auth.api';
import { uploadCoverPhoto, uploadProfilePhoto } from '../api/users.api';
import type { User } from '../types';
import { authKeys, userKeys } from './queryKeys';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export function useUploadPhoto() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (file: File) => uploadProfilePhoto(file),
    onSuccess: async (photoUrl) => {
      if (photoUrl) {
        qc.setQueryData<User>(authKeys.profile, (old) => (old ? { ...old, photo: photoUrl } : old));
      }
      await qc.invalidateQueries({ queryKey: authKeys.profile });
      toast.push('Profile photo updated', 'success');
    },
  });
}

/**
 * Cover-photo upload (PUT /users/upload-cover), separate from the profile-photo mutation above. After a successful
 * upload the signed-in profile is re-read from the server, so the cover is the persisted one and survives a reload.
 * If neither the upload response nor the refreshed profile carries a cover URL, the user is told instead of
 * being shown a false success.
 */
export function useUploadCover() {
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (file: File) => uploadCoverPhoto(file),
    onSuccess: async (coverUrl) => {
      // Re-read from the server: your own profile now, and the cached public copy others would load.
      await qc.refetchQueries({ queryKey: authKeys.profile });
      if (user?.id) await qc.invalidateQueries({ queryKey: userKeys.profile(user.id) });

      if (qc.getQueryData<User>(authKeys.profile)?.cover) {
        toast.push('Cover photo updated', 'success');
      } else if (coverUrl) {
        // Shown for this session only: the profile endpoint didn't return it, so it won't persist across reloads.
        qc.setQueryData<User>(authKeys.profile, (old) => (old ? { ...old, cover: coverUrl } : old));
        toast.push("Cover uploaded, but your profile data doesn't include it, so it may not persist after a reload.", 'info');
      } else {
        toast.push("Cover uploaded, but the server's response had no cover URL this app recognises.", 'info');
      }
    },
  });
}

export function useChangePassword() {
  const { setToken } = useAuth();
  const toast = useToast();
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: (newToken) => {
      // The API rotates the token on password change; keep the session alive with the new one.
      if (newToken) setToken(newToken);
      toast.push('Password changed', 'success');
    },
  });
}
