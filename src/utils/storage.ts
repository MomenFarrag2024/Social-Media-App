const TOKEN_KEY = 'route-posts.token';

/**
 * Token persistence. localStorage is readable by any script running on the page,
 * so an XSS vulnerability would expose the token. The API only issues bearer
 * tokens (no httpOnly cookies), so this is the practical option for this project.
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage can be unavailable (private mode / blocked). The session then lasts until reload.
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};
