import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { api } from '../api/axiosInstance';
import { ApiError } from '../api/errors';

/**
 * Browser connectivity as tracked by TanStack Query's onlineManager, which listens to the window
 * `online` / `offline` events. The same flag pauses queries while offline, so there is one source of truth.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  );
}

/**
 * True when the app is stuck on a screen with nothing to show: some mounted query is paused (waiting
 * for the network) and has never received data. Screens with cached data are not "blocked".
 */
export function useBlockedByOffline(): boolean {
  const qc = useQueryClient();
  return useSyncExternalStore(
    (onChange) => qc.getQueryCache().subscribe(onChange),
    () =>
      qc
        .getQueryCache()
        .getAll()
        .some(
          (query) =>
            query.state.fetchStatus === 'paused' && query.state.data === undefined && query.getObserversCount() > 0,
        ),
    () => false,
  );
}

/** Health endpoint listed on the API's own docs site; any HTTP response (even an error status) proves reachability. */
async function serverReachable(): Promise<boolean> {
  try {
    await api.get('/api/health', { timeout: 5_000 });
    return true;
  } catch (error) {
    return error instanceof ApiError && error.status !== undefined;
  }
}

/** Manual "Retry": probes the server once, then resumes paused work and refetches failed queries. */
export function useConnectionRetry() {
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);
  const [stillOffline, setStillOffline] = useState(false);

  const retry = useCallback(async () => {
    setChecking(true);
    setStillOffline(false);
    try {
      if (await serverReachable()) {
        // Tell Query we're back: paused queries resume, and failed ones are refetched once (no retry loop).
        onlineManager.setOnline(true);
        await qc.refetchQueries({
          type: 'active',
          predicate: (query) => query.state.status === 'error' || query.state.fetchStatus === 'paused',
        });
      } else {
        setStillOffline(true);
      }
    } finally {
      setChecking(false);
    }
  }, [qc]);

  return { retry, checking, stillOffline };
}
