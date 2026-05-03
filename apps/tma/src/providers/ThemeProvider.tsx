import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getTgWebApp } from '@/lib/telegram';
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

function detectInitialMode(): { mode: ThemeMode; source: ThemeCtx['source'] } {
  // 1) Явный пользовательский выбор (localStorage)
  const stored = loadStoredTheme();
  if (stored) return { mode: stored, source: 'user' };

  // 2) Telegram colorScheme
  const tg = getTgWebApp();
  if (tg?.colorScheme === 'light' || tg?.colorScheme === 'dark') {
    return { mode: tg.colorScheme, source: 'telegram' };
  }

  // 3) prefers-color-scheme
  if (typeof window !== 'undefined' && window.matchMedia) {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (prefersLight) return { mode: 'light', source: 'system' };
  }

  // 4) Default — dark (текущая тема платформы)
  return { mode: 'dark', source: 'default' };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [{ mode, source }, setState] = useState(() => detectInitialMode());

  // Применяем тему к <html data-theme="...">
  useEffect(() => {
    applyThemeToDocument(mode);
  }, [mode]);

  // Если пользователь не делал явного выбора — слушаем Telegram themeChanged
  useEffect(() => {
    if (source === 'user') return;
    const tg = getTgWebApp();
    if (!tg?.onEvent) return;
    const onChange = () => {
      const next = tg.colorScheme;
      if (next === 'light' || next === 'dark') {
        setState({ mode: next, source: 'telegram' });
      }
    };
    tg.onEvent('themeChanged', onChange);
    return () => tg.offEvent?.('themeChanged', onChange);
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
