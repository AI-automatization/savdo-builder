import { useTheme } from '@/providers/ThemeProvider';

/**
 * Сегментированный переключатель «Авто / Светлая / Тёмная».
 * Auto — синхронизация с Telegram colorScheme или системой.
 */
export function ThemeToggle() {
  const { mode, setMode, source } = useTheme();
  const auto = source !== 'user';

  const setAuto = () => {
    // Сбрасываем сохранённый выбор: чтобы провайдер вернулся к Telegram/system
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem('savdo:theme');
      // Перезагрузка ThemeProvider произойдёт через ручной setMode на текущий
      // detectInitialMode-результат. Простое решение — refresh page.
      // Без перезагрузки: вычислить mode сейчас.
      window.location.reload();
    }
  };

  return (
    <div
      className="grid grid-cols-3 rounded-xl p-1 gap-1"
      style={{ background: 'var(--tg-surface)', border: '1px solid var(--tg-border-soft)' }}
    >
      <button
        onClick={setAuto}
        className="py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: auto ? 'var(--tg-accent-dim)' : 'transparent',
          color: auto ? 'var(--tg-accent)' : 'var(--tg-text-muted)',
          border: `1px solid ${auto ? 'var(--tg-accent)' : 'transparent'}`,
        }}
      >
        Авто
      </button>
      <button
        onClick={() => setMode('light')}
        className="py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: !auto && mode === 'light' ? 'var(--tg-accent-dim)' : 'transparent',
          color: !auto && mode === 'light' ? 'var(--tg-accent)' : 'var(--tg-text-muted)',
          border: `1px solid ${!auto && mode === 'light' ? 'var(--tg-accent)' : 'transparent'}`,
        }}
      >
        ☀ Светлая
      </button>
      <button
        onClick={() => setMode('dark')}
        className="py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: !auto && mode === 'dark' ? 'var(--tg-accent-dim)' : 'transparent',
          color: !auto && mode === 'dark' ? 'var(--tg-accent)' : 'var(--tg-text-muted)',
          border: `1px solid ${!auto && mode === 'dark' ? 'var(--tg-accent)' : 'transparent'}`,
        }}
      >
        🌙 Тёмная
      </button>
    </div>
  );
}
