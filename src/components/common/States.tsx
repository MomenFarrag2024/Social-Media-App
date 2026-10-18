import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { FiAlertTriangle, FiInbox } from 'react-icons/fi';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconType;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon: Icon = FiInbox, action }: EmptyStateProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center rounded-card border border-line bg-surface shadow-card px-6 py-12 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-soft text-muted">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ message, onRetry, title = 'Something went wrong' }: ErrorStateProps) {
  return (
    <div role="alert" className="animate-fade-in flex flex-col items-center rounded-card border border-line bg-surface shadow-card px-6 py-10 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <FiAlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
