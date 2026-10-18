import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** Prefix for tab/panel ids so panels can reference their tab with aria-labelledby. */
  idPrefix: string;
  /** Bottom rule under the tab row. Off when the parent already draws a separator. */
  bordered?: boolean;
}

export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

/** Underline tabs with a clear active state, equal-width on mobile, and arrow-key navigation. */
export function Tabs<T extends string>({ tabs, value, onChange, label, idPrefix, bordered = true }: TabsProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeIndex = tabs.findIndex((tab) => tab.id === value);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.id === value);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    const target = tabs[next];
    if (!target) return;
    onChange(target.id);
    refs.current[target.id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`relative flex ${bordered ? 'border-b border-line' : ''}`}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[tab.id] = node;
            }}
            id={tabId(idPrefix, tab.id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId(idPrefix, tab.id)}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-[15px] font-semibold transition-colors hover:bg-soft ${
              active ? 'text-brand-from' : 'text-muted'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
      {/* One indicator that slides between tabs (transform only). Tabs are equal width (flex-1). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[3px] transition-transform duration-300 ease-out"
        style={{ width: `${100 / tabs.length}%`, transform: `translateX(${Math.max(activeIndex, 0) * 100}%)` }}
      >
        <span className="accent-line mx-2 block h-full rounded-t" />
      </span>
    </div>
  );
}
