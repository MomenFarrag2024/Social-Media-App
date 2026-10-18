import { useState, type ReactNode } from 'react';
import { getErrorMessage } from '../../api/errors';
import { useSuggestions } from '../../hooks/usePosts';
import { Avatar } from '../common/Avatar';
import { PaginationBar } from '../common/PaginationBar';
import { PersonRow } from '../common/PersonRow';
import { Skeleton } from '../common/Skeleton';
import { UserLink } from '../common/UserLink';
import { UserSearch } from './UserSearch';

type PeopleTab = 'suggested' | 'search';

const TAB_LABELS: Record<PeopleTab, string> = { suggested: 'Suggested', search: 'Search' };

/** Suggested / Search switcher shared by the mobile strip and the desktop rail. */
function PeopleTabs({ value, onChange }: { value: PeopleTab; onChange: (tab: PeopleTab) => void }) {
  return (
    <div role="tablist" aria-label="People" className="mb-3 flex gap-1 rounded-lg bg-soft p-1">
      {(Object.keys(TAB_LABELS) as PeopleTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={value === tab}
          onClick={() => onChange(tab)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            value === tab ? 'bg-surface text-brand-from shadow-card' : 'text-muted hover:text-ink'
          }`}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}

type SuggestionsVariant = 'strip' | 'list';
const VARIANT_LIMIT: Record<SuggestionsVariant, number> = { strip: 10, list: 6 };

/** One page of suggested people (real API paging) with a Previous / page / Next bar underneath. */
function PagedSuggestions({
  variant,
  page,
  onPageChange,
}: {
  variant: SuggestionsVariant;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useSuggestions(VARIANT_LIMIT[variant], page);
  const users = data?.items ?? [];
  const nextPage = data?.nextPage ?? null;
  // The next page is only offered when the API says one exists; Previous never goes below page 1.
  const hasNext = !isError && nextPage !== null;
  const canNext = hasNext && !isPlaceholderData;
  const canPrevious = page > 1;
  // Stays mounted while a page loads (buttons are disabled then), so the bar doesn't flicker.
  const showBar = canPrevious || hasNext || isPlaceholderData;

  let body: ReactNode;
  if (isPending) {
    body =
      variant === 'strip' ? (
        <ul className="flex gap-4 overflow-x-auto px-1 pb-1">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="flex w-16 shrink-0 flex-col items-center gap-2">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </li>
          ))}
        </ul>
      );
  } else if (isError) {
    body = (
      <p role="alert" className="text-xs text-muted">
        {getErrorMessage(error, 'Could not load suggestions.')}{' '}
        <button type="button" className="font-medium text-brand-from hover:underline" onClick={() => void refetch()}>
          Retry
        </button>
      </p>
    );
  } else if (users.length === 0) {
    body = (
      <p className="text-xs text-muted">{page > 1 ? 'No more suggestions on this page.' : 'No suggestions right now.'}</p>
    );
  } else if (variant === 'strip') {
    body = (
      <ul className="flex gap-4 overflow-x-auto px-1 pb-1">
        {users.map((user) => (
          <li key={user.id || user.username} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
            <UserLink user={user} className="flex w-full flex-col items-center gap-1.5">
              <Avatar user={user} size="lg" />
              <span className="w-full truncate text-xs">{user.username ?? user.name}</span>
            </UserLink>
          </li>
        ))}
      </ul>
    );
  } else {
    body = (
      <ul className="space-y-3">
        {users.map((user) => (
          <PersonRow key={user.id || user.username} user={user} />
        ))}
      </ul>
    );
  }

  return (
    <>
      <div aria-busy={isPlaceholderData || undefined} className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        {body}
      </div>
      {showBar && (
        <PaginationBar
          label="Suggested people pages"
          page={page}
          canPrevious={canPrevious}
          canNext={canNext}
          loading={isPlaceholderData}
          onPrevious={() => onPageChange(Math.max(1, page - 1))}
          onNext={() => {
            if (nextPage !== null) onPageChange(nextPage);
          }}
        />
      )}
    </>
  );
}

/**
 * Suggested | Search switcher. The suggestions page lives here, above the tab content, so switching to
 * Search and back keeps the page; Search never uses it (it searches loaded people, not API pages).
 */
function PeoplePanel({ variant }: { variant: SuggestionsVariant }) {
  const [tab, setTab] = useState<PeopleTab>('suggested');
  const [page, setPage] = useState(1);
  return (
    <>
      <h2 className="mb-3 text-[17px] font-semibold">Suggested for you</h2>
      <PeopleTabs value={tab} onChange={setTab} />
      <div role="tabpanel">
        {tab === 'suggested' ? <PagedSuggestions variant={variant} page={page} onPageChange={setPage} /> : <UserSearch />}
      </div>
    </>
  );
}

/** Compact version shown on screens without the right rail. */
export function SuggestionsStrip() {
  return (
    <section aria-label="Suggested for you" className="rounded-card border border-line bg-surface p-4 shadow-card xl:hidden">
      <PeoplePanel variant="strip" />
    </section>
  );
}

/** Right-rail version (desktop). */
export function SuggestionsList() {
  return (
    <section aria-label="Find people">
      <PeoplePanel variant="list" />
    </section>
  );
}
