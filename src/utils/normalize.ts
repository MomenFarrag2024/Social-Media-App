export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() ? value : undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

/** Returns the first present (non-null/undefined) value among the given keys. */
export function pick(record: UnknownRecord, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

/** Extracts an id from a string, or from an object with `_id` / `id`. */
export function idOf(value: unknown): string | undefined {
  if (typeof value === 'string') return value || undefined;
  if (isRecord(value)) return asString(value._id) ?? asString(value.id);
  return undefined;
}

/** Extracts a URL from a string, `{ url }`-like object, or the first item of an array. */
export function urlOf(value: unknown): string | undefined {
  if (typeof value === 'string') return value || undefined;
  if (Array.isArray(value)) return urlOf(value[0]);
  if (isRecord(value)) return asString(pick(value, ['url', 'secure_url', 'src', 'path']));
  return undefined;
}

/** Reads a count from a numeric field, or the length of an array field. */
export function countOf(record: UnknownRecord, keys: readonly string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value.length;
    const num = asNumber(value);
    if (num !== undefined) return num;
  }
  return undefined;
}

export function dedupeById<T extends { id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}
