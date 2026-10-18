import { Skeleton } from '../common/Skeleton';

export function PostSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface shadow-card p-4" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <Skeleton className="mt-4 h-64 w-full rounded-xl" />
    </div>
  );
}
