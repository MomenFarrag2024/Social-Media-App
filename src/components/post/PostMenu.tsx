import { useEffect, useId, useRef, useState } from 'react';
import { FiEdit2, FiLink, FiMoreHorizontal, FiTrash2 } from 'react-icons/fi';
import { Spinner } from '../common/Spinner';

interface PostMenuProps {
  /** Edit and Delete are offered only for the signed-in user's own posts. */
  isOwner: boolean;
  onCopyLink: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** An action (e.g. delete) is running: the trigger shows a spinner and is disabled. */
  busy?: boolean;
}

/** Three-dot menu on every post. Closes on outside press, Escape, or when an item is chosen. */
export function PostMenu({ isOwner, onCopyLink, onEdit, onDelete, busy = false }: PostMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  const itemClass = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-soft';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={busy}
        aria-label="Post options"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-soft hover:text-ink disabled:opacity-60"
      >
        {busy ? <Spinner className="h-4 w-4" /> : <FiMoreHorizontal className="h-5 w-5" aria-hidden />}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="animate-pop-in absolute right-0 top-[48%] z-30 mt-1 w-56 origin-top-right overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
        >
          <button type="button" role="menuitem" className={itemClass} onClick={() => choose(onCopyLink)}>
            <FiLink className="h-4 w-4" aria-hidden /> Copy link
          </button>
          {isOwner && (
            <>
              <button type="button" role="menuitem" className={itemClass} onClick={() => choose(onEdit)}>
                <FiEdit2 className="h-4 w-4" aria-hidden /> Edit post
              </button>
              <button type="button" role="menuitem" className={`${itemClass} text-danger`} onClick={() => choose(onDelete)}>
                <FiTrash2 className="h-4 w-4 shrink-0" aria-hidden /> Delete post
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
