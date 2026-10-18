import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Full-screen image viewer on the native modal <dialog> (focus trap and Escape come from the browser).
 * Closes via the close button, Escape, or a click outside the image. The image keeps its aspect ratio.
 */
export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const timer = useRef<number | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Keep the page behind the viewer from scrolling on touch devices.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  // Fade/scale out (see `dialog[data-closing]` in index.css), then let the owner unmount the viewer.
  const requestClose = () => {
    if (timer.current) return;
    setClosing(true);
    timer.current = window.setTimeout(onClose, 140);
  };

  const closeOnBackdrop = (event: { target: unknown; currentTarget: unknown }) => {
    if (event.target === event.currentTarget) requestClose();
  };

  return (
    <dialog
      ref={ref}
      aria-label={alt}
      data-closing={closing || undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      // React events bubble through portals; stop them so nothing behind the viewer (links, buttons) reacts.
      onClick={(event) => {
        event.stopPropagation();
        closeOnBackdrop(event);
      }}
      className="m-0 h-dvh max-h-none w-dvw max-w-none overflow-hidden border-0 bg-transparent p-0 text-white backdrop:bg-black/90"
    >
      <div className="flex h-full w-full items-center justify-center p-4 sm:p-10" onClick={closeOnBackdrop}>
        {failedSrc === src ? (
          <p role="alert" className="rounded-xl bg-white/10 px-4 py-3 text-sm">
            This image couldn&apos;t be loaded.
          </p>
        ) : (
          <img
            src={src}
            alt={alt}
            onError={() => setFailedSrc(src)}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />
        )}
      </div>
      <button
        type="button"
        onClick={requestClose}
        aria-label="Close image viewer"
        autoFocus
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:right-5 sm:top-5"
      >
        <FiX className="h-5 w-5" aria-hidden />
      </button>
    </dialog>
  );
}

interface ImageViewerButtonProps {
  /** Without an image there is nothing to enlarge, so the children render untouched. */
  src: string | undefined;
  /** Alt text of the enlarged image. */
  alt: string;
  /** Accessible name of the trigger, e.g. "View Sara's profile photo". */
  label: string;
  className?: string;
  children: ReactNode;
}

/**
 * Wraps an avatar or banner in a button that opens it in the lightbox. A dedicated trigger like this never
 * competes with profile links: use it where the picture itself is not already a navigation link.
 */
export function ImageViewerButton({ src, alt, label, className = '', children }: ImageViewerButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (!src) return <>{children}</>;

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus(); // return focus to the trigger
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        data-no-press
        className={`block cursor-zoom-in ${className}`}
      >
        {children}
      </button>
      {open && createPortal(<ImageLightbox src={src} alt={alt} onClose={close} />, document.body)}
    </>
  );
}
