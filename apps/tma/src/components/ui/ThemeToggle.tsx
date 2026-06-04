/**
 * ThemeToggle: переключатель тёмной/светлой темы.
 *
 * Включён обратно с TMA-DESIGN-V2-MIGRATE-001 (04.06.2026) — стили мигрированы
 * на CSS-переменные maxsavdo design-v2 (Champagne Gold + Rich Black/Pure White),
 * light тема валидна. ADR-009.
 */
import { useTheme } from '@/providers/ThemeProvider';

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const isDark = mode === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'var(--tg-surface)',
        border: '1px solid var(--tg-border-soft)',
        color: 'var(--tg-text-secondary)',
        cursor: 'pointer',
        fontSize: 16,
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
