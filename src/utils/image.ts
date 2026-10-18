// ASSUMPTION: the API's real image rules are not documented. These are conservative
// client-side limits; the server's own validation message is always shown on failure.
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG, WebP or GIF image.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image is too large. The maximum size is 5 MB.';
  }
  return null;
}
