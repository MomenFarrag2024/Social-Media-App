const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'narrow' });

const UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return 'just now';
  for (const [unit, size] of UNITS) {
    if (abs >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(Math.round(seconds / 60), 'minute');
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(value);
}

/** Readable calendar date, or undefined when the value is missing or not a valid date. */
export function formatDate(value: string | undefined, options: { utc?: boolean } = {}): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    // Birth dates are calendar dates; formatting in UTC avoids a one-day shift in some time zones.
    timeZone: options.utc ? 'UTC' : undefined,
  }).format(date);
}

/**
 * Age in whole years from a date of birth, using today's date and counting a year only once the birthday
 * has occurred. Returns undefined for missing, invalid, or future dates.
 */
export function calculateAge(dateOfBirth: string | undefined, now: Date = new Date()): number | undefined {
  if (!dateOfBirth) return undefined;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return undefined;
  // Birth dates are calendar dates (see formatDate), so read them in UTC; "today" is the viewer's local date.
  let age = now.getFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 && age < 150 ? age : undefined;
}
