import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { FiAlertCircle, FiInfo } from 'react-icons/fi';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  /** Playing the exit animation; removed shortly after. */
  leaving: boolean;
}

export interface ToastContextValue {
  push: (message: string, kind?: ToastKind) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 3800;
const EXIT_MS = 220;

const ICONS = { error: FiAlertCircle, info: FiInfo } as const;
const COLORS = {
  success: 'text-emerald-600',
  error: 'text-danger',
  info: 'text-brand-from',
} as const;

/** Success icon whose check mark draws itself in. */
function AnimatedCheck({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`animate-pop-in ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="10" className="opacity-25" />
      <path d="M7 12.5l3.2 3.2L17 9" strokeLinecap="round" strokeLinejoin="round" className="animate-check-draw" />
    </svg>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, kind, message, leaving: false }]);
    window.setTimeout(() => {
      setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
      window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), EXIT_MS);
    }, VISIBLE_MS);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((toast) => {
          const iconClass = `mt-0.5 h-4 w-4 shrink-0 ${COLORS[toast.kind]}`;
          return (
            <div
              key={toast.id}
              role="status"
              className={`${toast.leaving ? 'animate-toast-out' : 'animate-toast-in'} pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-lg`}
            >
              {toast.kind === 'success' ? (
                <AnimatedCheck className={iconClass} />
              ) : (
                (() => {
                  const Icon = ICONS[toast.kind];
                  return <Icon className={iconClass} aria-hidden />;
                })()
              )}
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
