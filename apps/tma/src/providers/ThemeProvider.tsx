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

function detectInitialMode(): { mode: ThemeMode; source: ThemeCtx['source'] } {
  // Polat 07.05: TMA пока **force-dark**. 553 inline `rgba(255,255,255,X)`
  // hardcoded цветов в 40 файлах — на светлой теме всё белое на белом.
  // Светлая тема будет включена когда переведём styles на CSS-переменные
  // (отдельная миграция, ~3-4 часа). Пока юзер с light Telegram theme
  // получает читаемый dark UI вместо «ебени».
  const stored = loadStoredTheme();
  if (stored === 'dark') return { mode: 'dark', source: 'user' };
  return { mode: 'dark', source: 'default' };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [{ mode, source }, setState] = useState(() => detectInitialMode());

  // Применяем тему к <html data-theme="...">
  useEffect(() => {
    applyThemeToDocument(mode);
  }, [mode]);

  // Force-dark: themeChanged listener убран чтобы Telegram не переключал
  // обратно в light. Когда мигрируем styles на CSS-переменные — вернём.

  const setMode = useCallback((next: ThemeMode) => {
    // Только dark разрешён пока styles не мигрировали на CSS-переменные.
    if (next !== 'dark') return;
    saveTheme(next);
    setState({ mode: next, source: 'user' });
  }, []);

  const toggle = useCallback(() => {
    /* no-op пока force-dark */
  }, []);

  return <Ctx.Provider value={{ mode, setMode, toggle, source }}>{children}</Ctx.Provider>;
}
