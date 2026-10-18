import { useId, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const FIELD_CLASS =
  'block w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 transition focus:border-brand-from focus:outline-none focus:ring-2 focus:ring-brand-from/20 disabled:bg-soft';

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
}

function FieldShell({
  id,
  label,
  error,
  hint,
  children,
}: BaseProps & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextField({
  label,
  error,
  hint,
  id,
  className = '',
  ...rest
}: BaseProps & ComponentPropsWithRef<'input'>) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, error, hint)}
        className={`${FIELD_CLASS} ${error ? 'border-danger' : 'border-line'} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  id,
  className = '',
  children,
  ...rest
}: BaseProps & ComponentPropsWithRef<'select'>) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <FieldShell id={selectId} label={label} error={error} hint={hint}>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(selectId, error, hint)}
        className={`${FIELD_CLASS} ${error ? 'border-danger' : 'border-line'} ${className}`}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

/**
 * Password input with a show/hide toggle. It is the same <input> element in both states (only `type`
 * changes), so the typed value, react-hook-form registration and validation state are all preserved.
 */
export function PasswordField({
  label,
  error,
  hint,
  id,
  className = '',
  ...rest
}: BaseProps & Omit<ComponentPropsWithRef<'input'>, 'type'>) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          className={`${FIELD_CLASS} pr-11 ${error ? 'border-danger' : 'border-line'} ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted transition hover:text-ink focus-visible:outline-offset-[-2px]"
        >
          <span className="relative block h-4 w-4">
            <FiEye
              className={`absolute inset-0 h-4 w-4 transition duration-200 ${visible ? 'scale-50 -rotate-45 opacity-0' : 'opacity-100'}`}
              aria-hidden
            />
            <FiEyeOff
              className={`absolute inset-0 h-4 w-4 transition duration-200 ${visible ? 'opacity-100' : 'scale-50 rotate-45 opacity-0'}`}
              aria-hidden
            />
          </span>
        </button>
      </div>
    </FieldShell>
  );
}
