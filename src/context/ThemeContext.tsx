import { createContext, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  /** What the user picked. */
  preference: ThemePreference;
  /** What is actually applied right now ('system' resolved to the device setting). */
  resolved: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

// A genuine client-side preference, so localStorage is appropriate. Keep in sync with index.html.
const STORAGE_KEY = 'route-social.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark';
  } catch {
    return 'dark'; // storage blocked (private mode etc.)
  }
}

function subscribeToDeviceScheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const deviceIsDark = () => window.matchMedia(DARK_QUERY).matches;

/** The single place that switches the theme: it toggles the `dark` class and `color-scheme` on <html>. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const systemDark = useSyncExternalStore(subscribeToDeviceScheme, deviceIsDark, () => false);
  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  // Syncing React state to the DOM is exactly what an effect is for.
  const isFirstApply = useRef(true);
  useEffect(() => {
    const root = document.documentElement;
    // Cross-fade colours for a moment when the theme actually changes, but never on first load (the inline
    // script in index.html already applied the right theme before paint, so there is nothing to animate).
    if (!isFirstApply.current) {
      root.classList.add('theme-transition');
      window.setTimeout(() => root.classList.remove('theme-transition'), 320);
    }
    isFirstApply.current = false;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0f1226' : '#ffffff');
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisted (storage unavailable), but the choice still applies for this session.
    }
  }, []);

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
