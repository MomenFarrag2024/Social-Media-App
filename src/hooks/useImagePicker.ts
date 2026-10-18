import { useCallback, useEffect, useRef, useState } from 'react';
import { validateImage } from '../utils/image';

export interface ImagePicker {
  file: File | null;
  previewUrl: string | null;
  error: string | null;
  select: (file: File | null | undefined) => void;
  clear: () => void;
}

/** Holds one selected image with an object-URL preview that is always revoked. */
export function useImagePicker(): ImagePicker {
  const [selection, setSelection] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const revoke = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  const select = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      const problem = validateImage(file);
      if (problem) {
        setError(problem);
        return;
      }
      revoke();
      const url = URL.createObjectURL(file);
      urlRef.current = url;
      setError(null);
      setSelection({ file, url });
    },
    [revoke],
  );

  const clear = useCallback(() => {
    revoke();
    setSelection(null);
    setError(null);
  }, [revoke]);

  // Release the last preview URL on unmount.
  useEffect(() => revoke, [revoke]);

  return { file: selection?.file ?? null, previewUrl: selection?.url ?? null, error, select, clear };
}
