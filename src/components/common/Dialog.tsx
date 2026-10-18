import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { FiX } from 'react-icons/fi';

const EXIT_MS = 140; // keep in sync with `dialog[data-closing]` in index.css

const DialogCloseContext = createContext<() => void>(() => undefined);

/** Lets buttons inside a dialog (e.g. Cancel) close it with the exit animation. */
export function useDialogClose(): () => void {
  return useContext(DialogCloseContext);
}

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /**
   * When false (e.g. while a request is running) the dialog cannot be dismissed: Escape, the backdrop and the
   * close button are all ignored, so it can't disappear while its action is still in flight.
   */
  dismissible?: boolean;
  /** `alertdialog` for confirmations that need an explicit answer. */
  role?: 'dialog' | 'alertdialog';
  /** Id of the element describing the dialog (announced by screen readers). */
  describedBy?: string;
}

/** Modal built on the native <dialog>: focus trapping comes from the browser; scale + fade in and out via CSS. */
export function Dialog({ title, onClose, children, dismissible = true, role, describedBy }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const timer = useRef<number | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  // Plays the exit animation, then asks the owner to unmount the dialog.
  const requestClose = useCallback(() => {
    if (!dismissible || timer.current) return;
    setClosing(true);
    timer.current = window.setTimeout(onClose, EXIT_MS);
  }, [dismissible, onClose]);

  return (
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      data-closing={closing || undefined}
      onClose={onClose}
      // Escape fires `cancel` first; take over so it can animate (or be ignored while locked).
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        // React events bubble through the component tree, so keep dialog clicks from reaching parents.
        event.stopPropagation();
        if (event.target === event.currentTarget) requestClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[2px]"
    >
      <DialogCloseContext.Provider value={requestClose}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            disabled={!dismissible}
            aria-label="Close dialog"
            className="rounded-full p-1.5 text-muted transition hover:bg-soft hover:text-ink disabled:opacity-40"
          >
            <FiX className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
      </DialogCloseContext.Provider>
    </dialog>
  );
}
