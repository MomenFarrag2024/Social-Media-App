import { useCallback } from 'react';
import { Spinner } from './Spinner';

interface LoadMoreProps {
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  endLabel?: string;
}

/** Infinite-scroll sentinel with a manual "Load more" fallback. The observer is cleaned up by the ref callback. */
export function LoadMore({ hasNextPage, isFetching, onLoadMore, endLabel }: LoadMoreProps) {
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !hasNextPage || isFetching) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) onLoadMore();
        },
        { rootMargin: '400px' },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [hasNextPage, isFetching, onLoadMore],
  );

  if (!hasNextPage) {
    return endLabel ? <p className="py-6 text-center text-xs text-muted">{endLabel}</p> : null;
  }

  return (
    <div ref={sentinelRef} className="flex justify-center py-4">
      {isFetching ? (
        <span role="status" className="flex items-center gap-2 text-sm text-muted">
          <Spinner /> Loading more…
        </span>
      ) : (
        <button type="button" onClick={onLoadMore} className="text-sm font-medium text-brand-from hover:underline">
          Load more
        </button>
      )}
    </div>
  );
}
