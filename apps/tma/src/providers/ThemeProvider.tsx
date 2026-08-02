import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { applyThemeToDocument, loadStoredTheme, saveTheme, type ThemeMode } from '@/lib/themes';

interface ThemeCtx {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  source: 'user' | 'telegram' | 'system' | 'default';
}

const Ctx = createContext<ThemeCtx>({
  mode: 'dark',
  setMode: () => {},
  toggle: () => {},
  source: 'default',
});

export const useTheme = () => useContext(Ctx);

// ADR-009 + TMA-DESIGN-V2-MIGRATE-001 (04.06.2026):
// После миграции styles на CSS-переменные (Champagne Gold + Rich Black +
// Pure White) light тема снова валидна. Detection приоритет:
//   1. user choice (localStorage)
//   2. Telegram WebApp themeParams.color_scheme
//   3. prefers-color-scheme system media query
//   4. fallback = dark (luxury aesthetic)
function detectInitialMode(): { mode: ThemeMode; source: ThemeCtx['source'] } {
  const stored = loadStoredTheme();
  if (stored) return { mode: stored, source: 'user' };

  // Telegram WebApp colorScheme (если запущен внутри TG)
  try {
    const tgScheme = (window as unknown as {
      Telegram?: { WebApp?: { colorScheme?: 'light' | 'dark' } };
    }).Telegram?.WebApp?.colorScheme;
    if (tgScheme === 'light' || tgScheme === 'dark') {
      return { mode: tgScheme, source: 'telegram' };
    }
  } catch { /* SSR / no TG */ }

  // System preference
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      if (prefersLight) return { mode: 'light', source: 'system' };
      return { mode: 'dark', source: 'system' };
    }
  } catch { /* noop */ }

  return { mode: 'dark', source: 'default' };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [{ mode, source }, setState] = useState(() => detectInitialMode());

  // Применяем тему к <html data-theme="...">
  useEffect(() => {
    applyThemeToDocument(mode);
  }, [mode]);

  // Если юзер не задал тему сам — слушаем системные изменения и Telegram
  // themeChanged event для синхронизации.
  useEffect(() => {
    if (source === 'user') return;

    const cleanup: Array<() => void> = [];

    // System media query
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e: MediaQueryListEvent) => {
          setState((prev) => prev.source === 'user'
            ? prev
            : { mode: e.matches ? 'dark' : 'light', source: 'system' });
        };
        mq.addEventListener?.('change', onChange);
        cleanup.push(() => mq.removeEventListener?.('change', onChange));
      }
    } catch { /* noop */ }

    // Telegram themeChanged
    try {
      const tg = (window as unknown as {
        Telegram?: {
          WebApp?: {
            colorScheme?: 'light' | 'dark';
            onEvent?: (event: string, cb: () => void) => void;
            offEvent?: (event: string, cb: () => void) => void;
          };
        };
      }).Telegram?.WebApp;

      if (tg?.onEvent && tg?.offEvent) {
        const onTgChange = () => {
          const next = tg.colorScheme;
          if (next === 'light' || next === 'dark') {
            setState((prev) => prev.source === 'user'
              ? prev
              : { mode: next, source: 'telegram' });
          }
        };
        tg.onEvent('themeChanged', onTgChange);
        cleanup.push(() => tg.offEvent?.('themeChanged', onTgChange));
      }
    } catch { /* noop */ }

    return () => cleanup.forEach((fn) => { try { fn(); } catch { /* noop */ } });
  }, [source]);

  const setMode = useCallback((next: ThemeMode) => {
    saveTheme(next);
    setState({ mode: next, source: 'user' });
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => {
      const next: ThemeMode = prev.mode === 'dark' ? 'light' : 'dark';
      saveTheme(next);
      return { mode: next, source: 'user' };
    });
  }, []);

  return <Ctx.Provider value={{ mode, setMode, toggle, source }}>{children}</Ctx.Provider>;
}
