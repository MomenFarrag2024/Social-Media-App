import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '../api/axiosInstance';
import { getProfile } from '../api/users.api';
import { authKeys } from '../hooks/queryKeys';
import type { User } from '../types';
import { tokenStorage } from '../utils/storage';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  profileError: unknown;
  /** Stores a token (login / signup / rotated token) and loads the profile. */
  setToken: (token: string) => void;
  signOut: () => void;
  retryProfile: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(() => tokenStorage.get());

  const profile = useQuery({
    queryKey: authKeys.profile,
    queryFn: getProfile,
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const signOut = useCallback(() => {
    tokenStorage.clear();
    setTokenState(null);
    queryClient.clear();
  }, [queryClient]);

  const setToken = useCallback((next: string) => {
    tokenStorage.set(next);
    setTokenState(next);
  }, []);

  // A 401 from any protected request (expired/invalid token) ends the session.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const { refetch } = profile;
  const retryProfile = useCallback(() => {
    void refetch();
  }, [refetch]);

  let status: AuthStatus;
  if (!token) status = 'unauthenticated';
  else if (profile.data) status = 'authenticated';
  else if (profile.isError) status = 'error';
  else status = 'loading';

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: token ? (profile.data ?? null) : null,
      profileError: profile.error,
      setToken,
      signOut,
      retryProfile,
    }),
    [status, token, profile.data, profile.error, setToken, signOut, retryProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
