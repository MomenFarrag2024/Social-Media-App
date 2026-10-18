import { useRef } from 'react';
import { FiCamera } from 'react-icons/fi';
import { ACCEPTED_IMAGE_TYPES } from '../../utils/image';

interface CameraButtonProps {
  onSelect: (file: File | undefined) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

/** Camera-style round button that opens the file picker. Never submits a form or triggers a parent link. */
export function CameraButton({ onSelect, label, disabled, className = '' }: CameraButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          onSelect(event.target.files?.[0]);
          event.target.value = ''; // allow re-selecting the same file
        }}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          inputRef.current?.click();
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink shadow ring-1 ring-line transition hover:bg-soft disabled:opacity-60 ${className}`}
      >
        <FiCamera className="h-4 w-4" aria-hidden />
      </button>
    </>
  );
}
