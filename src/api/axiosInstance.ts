import axios from 'axios';
import type { ApiFieldIssue } from '../types';
import { asString, isRecord } from '../utils/normalize';
import { tokenStorage } from '../utils/storage';
import { ApiError } from './errors';

const DEFAULT_BASE_URL = 'https://route-posts.routemisr.com';

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
  timeout: 30_000,
});

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registered by AuthProvider so a 401 anywhere ends the session. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

// Endpoints where a 401/403 means "bad credentials", not "expired session".
const SESSION_NEUTRAL_URLS = ['/users/signin', '/users/signup', '/users/change-password'];

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  // For FormData, the browser/Axios sets the multipart boundary automatically.
  return config;
});

function toIssue(item: unknown): ApiFieldIssue | null {
  if (typeof item === 'string') return { message: item };
  if (isRecord(item)) {
    const message = asString(item.message) ?? asString(item.msg);
    if (!message) return null;
    return { field: asString(item.field) ?? asString(item.path) ?? asString(item.param), message };
  }
  return null;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data: unknown = error.response?.data;
      const url = error.config?.url ?? '';

      if (status === 401 && !SESSION_NEUTRAL_URLS.some((path) => url.includes(path))) {
        unauthorizedHandler?.();
      }

      if (!error.response) {
        return Promise.reject(
          new ApiError('Unable to reach the server. Check your connection (or CORS settings) and try again.'),
        );
      }

      const message = (isRecord(data) ? asString(data.message) : undefined) ?? error.message ?? 'Request failed';
      const issues =
        isRecord(data) && Array.isArray(data.errors)
          ? data.errors.map(toIssue).filter((issue): issue is ApiFieldIssue => issue !== null)
          : [];
      return Promise.reject(new ApiError(message, status, issues));
    }
    return Promise.reject(error instanceof Error ? error : new Error('Unexpected error'));
  },
);
