import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { isRecord } from './normalize';

export type Snapshot = Array<[QueryKey, unknown]>;

export function snapshotQueries(qc: QueryClient, queryKey: QueryKey): Snapshot {
  return qc.getQueriesData({ queryKey });
}

export function restoreSnapshot(qc: QueryClient, snapshot: Snapshot): void {
  for (const [key, data] of snapshot) qc.setQueryData(key, data);
}

/**
 * Applies `patch` to the item with `id` inside cached query data. Handles both
 * infinite queries ({ pages: [{ items }] }), plain collections ({ items }) and single-item queries ({ id, ... }).
 */
export function mapItemInCache<T extends { id: string }>(
  old: unknown,
  id: string,
  patch: (item: T) => T,
): unknown {
  if (!isRecord(old)) return old;

  if (Array.isArray(old.pages)) {
    return {
      ...old,
      pages: old.pages.map((page: unknown) => {
        if (!isRecord(page) || !Array.isArray(page.items)) return page;
        return {
          ...page,
          items: page.items.map((item: unknown) =>
            isRecord(item) && item.id === id ? patch(item as unknown as T) : item,
          ),
        };
      }),
    };
  }

  if (Array.isArray(old.items)) {
    return {
      ...old,
      items: old.items.map((item: unknown) => (isRecord(item) && item.id === id ? patch(item as unknown as T) : item)),
    };
  }

  if (old.id === id) return patch(old as unknown as T);
  return old;
}

/** Removes the item with `id` from cached collections ({ pages: [{ items }] } or { items }). */
export function removeItemFromCache(old: unknown, id: string): unknown {
  if (!isRecord(old)) return old;
  const without = (items: unknown[]) => items.filter((item) => !(isRecord(item) && item.id === id));

  if (Array.isArray(old.pages)) {
    return {
      ...old,
      pages: old.pages.map((page: unknown) =>
        isRecord(page) && Array.isArray(page.items) ? { ...page, items: without(page.items) } : page,
      ),
    };
  }
  if (Array.isArray(old.items)) return { ...old, items: without(old.items) };
  return old;
}
