import type { ReactNode } from 'react';
import { FiWifiOff } from 'react-icons/fi';
import { OfflinePage } from '../common/OfflinePage';
import { useBlockedByOffline, useOnlineStatus } from '../../hooks/useNetworkStatus';

/**
 * Global connectivity handling, based on the browser's online/offline state (never on a single failed
 * request, so ordinary server errors keep their normal error screens):
 *  - offline with nothing cached to show -> full offline page
 *  - offline with cached content         -> small indicator, content stays usable
 */
export function NetworkGate({ children }: { children: ReactNode }) {
  const online = useOnlineStatus();
  const blocked = useBlockedByOffline();
  const showPage = !online && blocked;

  return (
    <>
      <div inert={showPage} aria-hidden={showPage || undefined}>
        {children}
      </div>
      {showPage && <OfflinePage />}
      {!online && !showPage && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-surface shadow-lg md:bottom-4"
        >
          <FiWifiOff aria-hidden /> You&apos;re offline. Showing saved content; changes can&apos;t be made.
        </div>
      )}
    </>
  );
}
