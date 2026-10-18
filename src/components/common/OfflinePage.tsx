import { FiWifiOff } from 'react-icons/fi';
import { useConnectionRetry } from '../../hooks/useNetworkStatus';
import { Button } from './Button';
import { Logo } from './Logo';

/** Full-screen offline state, shown over the app (which stays mounted so no state or cache is lost). */
export function OfflinePage() {
  const { retry, checking, stillOffline } = useConnectionRetry();

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      aria-describedby="offline-description"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-canvas px-6 text-center"
    >
      <div className="mb-10">
        <Logo />
      </div>
      <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-gradient text-white">
        <FiWifiOff className="h-9 w-9" aria-hidden />
      </span>
      <h1 id="offline-title" className="text-2xl font-bold">
        You&apos;re offline
      </h1>
      <p id="offline-description" className="mt-2 max-w-sm text-sm text-muted">
        Your internet connection is unavailable. You&apos;re still signed in, and nothing you were viewing is lost. This
        page will recover automatically when you&apos;re back online.
      </p>
      <Button className="mt-8" loading={checking} onClick={() => void retry()}>
        Retry
      </Button>
      <p role="status" className="mt-4 min-h-5 text-xs text-muted">
        {checking ? 'Checking your connection…' : stillOffline ? "Still can't reach the server." : ''}
      </p>
    </div>
  );
}
