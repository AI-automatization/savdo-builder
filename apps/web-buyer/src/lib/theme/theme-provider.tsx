'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** User-selected theme. `'system'` means follow OS preference. */
  theme: Theme;
  /** Currently applied theme — never `'system'`. */
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
  /** Quick swap between light & dark. If currently `'system'`, jumps to the opposite of resolved. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = 'savdo-theme';
const VALID: Theme[] = ['light', 'dark', 'system'];

function readSystem(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(defaultTheme: Theme): Theme {
  if (typeof window === 'undefined') return defaultTheme;
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return v && VALID.includes(v) ? v : defaultTheme;
  } catch {
    return defaultTheme;
  }
}

function apply(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolved);
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: {
  children: React.ReactNode;
  /** Initial theme if nothing stored. Buyer defaults to `'system'`; seller may override to `'dark'`. */
  defaultTheme?: Theme;
}) {
  // Initial state matches what the inline ThemeScript already wrote on <html>,
  // so React's first paint won't fight it.
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolved] = useState<ResolvedTheme>('light');

  // After hydration, sync from localStorage (the inline script also reads this,
  // but keeping React state in sync lets the toggle UI reflect reality).
  useEffect(() => {
    const stored = readStored(defaultTheme);
    setThemeState(stored);
  }, [defaultTheme]);

  // React to theme changes — apply to <html> and update resolved.
  useEffect(() => {
    const r: ResolvedTheme = theme === 'system' ? readSystem() : theme;
    setResolved(r);
    apply(r);

    if (theme === 'system' && typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => {
        const next = readSystem();
        setResolved(next);
        apply(next);
      };
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(THEME_STORAGE_KEY, t); } catch {}
    }
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
