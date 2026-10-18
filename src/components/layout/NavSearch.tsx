import { useDeferredValue, useEffect, useId, useRef, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useUserSearch } from '../../hooks/useUserSearch';
import { PersonRow } from '../common/PersonRow';
import { Skeleton } from '../common/Skeleton';

const MAX_RESULTS = 6;

/**
 * Header people search. Same data and limits as the Search tab (no server search exists): suggested people
 * and authors already loaded. Results open in a dropdown; Escape, an outside press or choosing a person closes it.
 */
export function NavSearch({ autoFocus = false, className = '' }: { autoFocus?: boolean; className?: string }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const search = useUserSearch(useDeferredValue(value));
  const results = search.results.slice(0, MAX_RESULTS);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const done = () => {
    setOpen(false);
    setValue('');
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        role="combobox"
        aria-label="Search people"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder="Search people"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-10 w-full rounded-full bg-soft pl-10 pr-4 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-from/40"
      />

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="People results"
          className="animate-pop-in absolute left-0 top-full z-50 mt-2 w-full min-w-72 origin-top-left rounded-xl border border-line bg-surface p-3 shadow-xl"
        >
          {!search.term && <p className="text-sm text-muted">Type a name or username to find people.</p>}

          {search.term && search.isLoading && results.length === 0 && (
            <ul className="space-y-3" aria-label="Searching">
              {[0, 1, 2].map((key) => (
                <li key={key} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-3 w-28" />
                </li>
              ))}
            </ul>
          )}

          {search.term && results.length > 0 && (
            <ul className="space-y-3">
              {results.map((user) => (
                <PersonRow key={user.id} user={user} onNavigate={done} />
              ))}
            </ul>
          )}

          {search.term && !search.isLoading && results.length === 0 && (
            <p className="text-sm text-muted">No people found for &ldquo;{value.trim()}&rdquo;.</p>
          )}

          {search.term && search.isError && (
            <p role="alert" className="mt-2 text-xs text-muted">
              Couldn&apos;t load suggestions; showing people already loaded.{' '}
              <button type="button" className="font-medium text-brand-from hover:underline" onClick={() => void search.refetch()}>
                Retry
              </button>
            </p>
          )}

          <p className="mt-3 border-t border-line pt-2 text-[11px] leading-snug text-muted">
            Searches suggested people and people from posts you&apos;ve loaded; Route Posts has no user-search service.
          </p>
        </div>
      )}
    </div>
  );
}
