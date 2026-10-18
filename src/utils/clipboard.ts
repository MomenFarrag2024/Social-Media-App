/**
 * Copies text to the clipboard. Prefers the async Clipboard API (secure contexts only) and falls back to a
 * temporary textarea + execCommand for older browsers or plain-http pages. Resolves to whether it worked.
 */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or document not focused: try the fallback below.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

/** Absolute URL of a post's details page (the same route direct links use). */
export function postUrl(postId: string): string {
  return `${window.location.origin}/posts/${encodeURIComponent(postId)}`;
}
