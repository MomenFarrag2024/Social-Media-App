import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Button } from './Button';
import { Spinner } from './Spinner';

interface PaginationBarProps {
  page: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** The newly selected page is still loading: navigation is paused so requests can't pile up. */
  loading?: boolean;
  label: string;
}

/** Previous (left) · current page (centre) · Next (right). */
export function PaginationBar({ page, canPrevious, canNext, onPrevious, onNext, loading = false, label }: PaginationBarProps) {
  return (
    <nav aria-label={label} className="mt-4 flex items-center justify-between gap-2">
      <Button variant="secondary" size="sm" disabled={!canPrevious || loading} onClick={onPrevious} aria-label="Previous page">
        <FiChevronLeft aria-hidden /> Previous
      </Button>
      <span aria-live="polite" aria-current="page" className="relative min-w-8 text-center text-sm font-semibold tabular-nums">
        <span className="sr-only">Page </span>
        {page}
        {loading && <Spinner className="absolute -right-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />}
      </span>
      <Button variant="secondary" size="sm" disabled={!canNext || loading} onClick={onNext} aria-label="Next page">
        Next <FiChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
