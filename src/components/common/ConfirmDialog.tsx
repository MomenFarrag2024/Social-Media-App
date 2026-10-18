import { useId, type ReactNode } from 'react';
import { FiAlertTriangle, FiHelpCircle } from 'react-icons/fi';
import { Button } from './Button';
import { Dialog, useDialogClose } from './Dialog';

interface ConfirmDialogProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** `danger` (red) for deletions; `primary` for logout and unfollow. */
  variant?: 'danger' | 'primary';
  /** The action is running: both buttons lock and the dialog can't be dismissed. */
  loading?: boolean;
  /** Shown inside the dialog when the action failed; the dialog stays open so the user can retry or cancel. */
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Cancel closes through the dialog so it plays the exit animation; it never runs the action. */
function CancelButton({ disabled }: { disabled: boolean }) {
  const close = useDialogClose();
  return (
    <Button variant="secondary" disabled={disabled} onClick={close}>
      Cancel
    </Button>
  );
}

/**
 * The one confirmation dialog used for every destructive or important action. It never runs anything by
 * itself: `onConfirm` fires only from the confirm button; Cancel, Escape and the backdrop only call `onClose`.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  variant = 'danger',
  loading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const descriptionId = useId();
  const danger = variant === 'danger';
  const Icon = danger ? FiAlertTriangle : FiHelpCircle;

  return (
    <Dialog title={title} onClose={onClose} dismissible={!loading} role="alertdialog" describedBy={descriptionId}>
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            danger ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand-from'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <p id={descriptionId} className="min-w-0 break-words pt-1.5 text-sm text-muted">
          {description}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <CancelButton disabled={loading} />
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
