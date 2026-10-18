import { SuggestionsList } from './Suggestions';

/** Right column on wide screens: the "Suggested for you" panel. */
export function RightRail() {
  return (
    <aside
      aria-label="Suggested for you"
      className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-80 shrink-0 flex-col gap-4 overflow-y-auto px-2 py-4 xl:flex"
    >
      <div className="rounded-card border border-line bg-surface p-4 shadow-card">
        <SuggestionsList />
      </div>
    </aside>
  );
}
