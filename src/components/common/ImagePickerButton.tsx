import { useRef } from 'react';
import { FiImage, FiX } from 'react-icons/fi';
import { ACCEPTED_IMAGE_TYPES } from '../../utils/image';

interface ImagePickerButtonProps {
  onSelect: (file: File | undefined) => void;
  disabled?: boolean;
  label?: string;
}

export function ImagePickerButton({ onSelect, disabled, label = 'Photo' }: ImagePickerButtonProps) {
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
        aria-label={label || 'Add photo'}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-soft hover:text-ink disabled:opacity-50"
      >
        <FiImage className="h-5 w-5 text-emerald-500" aria-hidden />
        {label}
      </button>
    </>
  );
}

interface ImagePreviewProps {
  url: string;
  alt: string;
  onRemove: () => void;
  disabled?: boolean;
}

export function ImagePreview({ url, alt, onRemove, disabled }: ImagePreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-soft">
      <img src={url} alt={alt} className="max-h-80 w-full object-contain" />
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove image"
        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80 disabled:opacity-50"
      >
        <FiX className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
