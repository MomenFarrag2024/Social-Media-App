import { useDeferredValue, useId, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { getErrorMessage } from '../../api/errors';
import { SEARCH_PAGE_SIZE, useUserSearch } from '../../hooks/useUserSearch';
import { PaginationBar } from '../common/PaginationBar';
import { PersonRow } from '../common/PersonRow';
import { Skeleton } from '../common/Skeleton';

/** Search people by name or username within the people the app already knows (see useUserSearch). */
export function UserSearch() {
  const inputId = useId();
  const [value, setValue] = useState('');
  const deferred = useDeferredValue(value);
  const search = useUserSearch(deferred);

  // The page is remembered together with the (normalised) query it belongs to. When the query changes the
  // stored page no longer matches, so we fall back to page 1: no effect or extra render, and results of
  // one query can never be shown under another query's page number.
  const [paging, setPaging] = useState({ term: '', page: 1 });
  const totalPages = Math.max(1, Math.ceil(search.results.length / SEARCH_PAGE_SIZE));
  const requestedPage = paging.term === search.term ? paging.page : 1;
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const pageResults = search.results.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE);
  const goToPage = (next: number) =>
    setPaging({ term: search.term, page: Math.min(Math.max(1, next), totalPages) });

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        Search people by name or username
      </label>
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search name or username"
          autoComplete="off"
          className="block w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand-from focus:outline-none focus:ring-2 focus:ring-brand-from/20"
        />
      </div>

      <div className="mt-3" aria-live="polite">
        {!search.term && <p className="text-xs text-muted">Type a name or username to find people.</p>}

        {search.term && search.isLoading && search.results.length === 0 && (
          <ul className="space-y-3" aria-label="Searching">
            {[0, 1, 2].map((key) => (
              <li key={key} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-3 w-28" />
              </li>
            ))}
          </ul>
        )}

        {search.term && search.results.length > 0 && (
          <ul className="space-y-3" aria-label="Search results">
            {pageResults.map((user) => (
              <PersonRow key={user.id} user={user} />
            ))}
          </ul>
        )}

        {search.term && totalPages > 1 && (
          <PaginationBar
            label="Search result pages"
            page={page}
            canPrevious={page > 1}
            canNext={page < totalPages}
            onPrevious={() => goToPage(page - 1)}
            onNext={() => goToPage(page + 1)}
          />
        )}

        {search.term && !search.isLoading && search.results.length === 0 && (
          <p className="text-xs text-muted">No people found for &ldquo;{value.trim()}&rdquo;.</p>
        )}

        {search.term && search.isError && (
          <p role="alert" className="mt-2 text-xs text-muted">
            {getErrorMessage(search.error, 'Could not load suggestions.')} Showing people already loaded.{' '}
            <button type="button" className="font-medium text-brand-from hover:underline" onClick={() => void search.refetch()}>
              Retry
            </button>
          </p>
        )}
      </div>

      <p className="mt-3 text-[11px] leading-snug text-muted">
        Route Posts has no user-search service, so this searches suggested people and people from posts you&apos;ve
        loaded, and pages through those matches here on your device.
      </p>
    </div>
  );
}
