import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, getErrorMessage } from '../api/errors';

/**
 * Maps server-side validation issues onto form fields. Returns a form-level
 * message for anything that could not be matched to a field, or null when every
 * issue was attached to a field.
 *
 * `fields` order matters: list more specific names first (e.g. `rePassword` before `password`).
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: ReadonlyArray<Path<T>>,
): string | null {
  if (!(error instanceof ApiError) || error.issues.length === 0) return getErrorMessage(error);

  let unmatched = false;
  for (const issue of error.issues) {
    const text = issue.message.toLowerCase();
    const target = fields.find(
      (field) => issue.field?.toLowerCase() === field.toLowerCase() || text.includes(field.toLowerCase()),
    );
    if (target) setError(target, { type: 'server', message: issue.message });
    else unmatched = true;
  }
  return unmatched ? getErrorMessage(error) : null;
}
