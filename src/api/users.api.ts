import type { ApiEnvelope, Page, Post, User } from '../types';
import { asBoolean, isRecord, pick, urlOf } from '../utils/normalize';
import { api } from './axiosInstance';
import { ApiError } from './errors';
import { normalizePost, normalizeUser, parsePage } from './normalizers';

export async function getProfile(): Promise<User> {
  const { data } = await api.get<ApiEnvelope>('/users/profile-data');
  const payload = isRecord(data.data) && isRecord(data.data.user) ? data.data.user : data.data;
  const user = normalizeUser(payload);
  if (!user) throw new ApiError('Unexpected profile response from the server.');
  return user;
}

// ASSUMPTION: the multipart field for the profile photo is named `photo`.
const PHOTO_FIELD = 'photo';

/** Uploads a profile photo. Returns the new photo URL when the response includes one. */
export async function uploadProfilePhoto(file: File): Promise<string | undefined> {
  const form = new FormData();
  form.append(PHOTO_FIELD, file);
  const { data } = await api.put<ApiEnvelope>('/users/upload-photo', form);
  const payload = data.data;
  const user = normalizeUser(isRecord(payload) && isRecord(payload.user) ? payload.user : payload);
  return user?.photo ?? (isRecord(payload) ? urlOf(pick(payload, ['photo', 'url'])) : undefined);
}

// ---------------------------------------------------------------------------------------------
// Cover photo: PUT /users/upload-cover (reported working by the API owner; not on the public docs page).
// What is confirmed: the method and path, bearer auth, and that the server validates a *file* (it rejected a
// JSON body with missing fieldname/originalname/encoding/mimetype/path, i.e. multer file metadata), so the
// image must be sent as multipart/form-data with a real File.
// NOT confirmed: the multipart field name. COVER_FIELD is a best guess and is the ONE place to change it.
// ---------------------------------------------------------------------------------------------
const COVER_FIELD = 'cover';

/**
 * Uploads the signed-in user's cover photo as multipart/form-data. Axios sets the multipart boundary itself
 * (no Content-Type is set here). Returns the new cover URL when the response contains a recognisable one.
 */
export async function uploadCoverPhoto(file: File): Promise<string | undefined> {
  const form = new FormData();
  form.append(COVER_FIELD, file); // the real File object, so its name and type are sent
  const { data } = await api.put<ApiEnvelope>('/users/upload-cover', form);
  const payload = data.data;
  const user = normalizeUser(isRecord(payload) && isRecord(payload.user) ? payload.user : payload);
  return user?.cover ?? (isRecord(payload) ? urlOf(pick(payload, ['cover', 'coverPhoto', 'coverImage', 'banner', 'url'])) : undefined);
}

export async function getSuggestions(page: number, limit: number): Promise<Page<User>> {
  const { data } = await api.get<ApiEnvelope>('/users/suggestions', { params: { page, limit } });
  return parsePage(data, normalizeUser, ['suggestions', 'users'], page, limit);
}

// ---------------------------------------------------------------------------------------------
// The three endpoints below are NOT in the official endpoint table. They are documented by several
// independent projects built on this API (PUT /users/:id/follow, GET /users/:id/profile,
// GET /users/:id/posts) but have not been verified against the Postman docs or the live API.
// The UI treats a 404 as "not supported" and falls back to what the documented endpoints provide.
// Response shapes are ASSUMPTIONS; adjust only here and in api/normalizers.ts.
// ---------------------------------------------------------------------------------------------

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/** Another user's profile. Resolves to null when the API reports 404 (unsupported or unknown user). */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const { data } = await api.get<ApiEnvelope>(`/users/${encodeURIComponent(userId)}/profile`);
    const payload = data.data;
    const userPayload = isRecord(payload) ? (pick(payload, ['user', 'profile']) ?? payload) : payload;
    const user = normalizeUser(userPayload);
    if (!user) return null;
    // The follow flag may sit beside the user object rather than inside it.
    const topLevelFlag = isRecord(payload) ? asBoolean(pick(payload, ['isFollowing', 'followedByMe'])) : undefined;
    return user.isFollowing === undefined && topLevelFlag !== undefined ? { ...user, isFollowing: topLevelFlag } : user;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function getUserPosts(userId: string, page: number, limit = 10): Promise<Page<Post>> {
  const { data } = await api.get<ApiEnvelope>(`/users/${encodeURIComponent(userId)}/posts`, {
    params: { page, limit },
  });
  return parsePage(data, (raw) => normalizePost(raw), ['posts', 'items'], page, limit);
}

/** Toggles follow/unfollow. The caller must know the current state; this endpoint is a toggle. */
export async function followUser(userId: string): Promise<void> {
  await api.put(`/users/${encodeURIComponent(userId)}/follow`);
}
