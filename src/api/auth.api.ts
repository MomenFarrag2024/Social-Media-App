import type { ApiEnvelope, AuthResult } from '../types';
import { asString, isRecord, pick } from '../utils/normalize';
import { api } from './axiosInstance';
import { ApiError } from './errors';
import { normalizeUser } from './normalizers';

// ASSUMPTION: signup field names follow common conventions for this API family.
// Verify against the Postman docs / a real response and adjust here only.
export interface SignupPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  rePassword: string;
  dateOfBirth: string;
  gender: string;
}

export interface SigninPayload {
  identifier: string;
  password: string;
}

function parseAuth(envelope: ApiEnvelope): AuthResult {
  const data = envelope.data;
  const token = isRecord(data) ? asString(data.token) : undefined;
  if (!token) throw new ApiError('The server did not return an authentication token.');
  const user = isRecord(data) ? normalizeUser(data.user) : null;
  return { token, user };
}

export async function signUp(payload: SignupPayload): Promise<AuthResult> {
  const { data } = await api.post<ApiEnvelope>('/users/signup', payload);
  return parseAuth(data);
}

export async function signIn({ identifier, password }: SigninPayload): Promise<AuthResult> {
  // ASSUMPTION: the docs say "sign in by login/email/username" without naming the field.
  // An identifier containing "@" is sent as `email`, otherwise as `username`.
  const body = identifier.includes('@') ? { email: identifier, password } : { username: identifier, password };
  const { data } = await api.post<ApiEnvelope>('/users/signin', body);
  return parseAuth(data);
}

export interface ChangePasswordPayload {
  password: string;
  newPassword: string;
}

/** Returns the rotated token when the API provides one (the docs say the token is rotated). */
export async function changePassword(payload: ChangePasswordPayload): Promise<string | null> {
  // ASSUMPTION: body fields are `password` (current) and `newPassword`.
  const { data } = await api.patch<ApiEnvelope>('/users/change-password', payload);
  return isRecord(data.data) ? (asString(pick(data.data, ['token'])) ?? null) : null;
}
