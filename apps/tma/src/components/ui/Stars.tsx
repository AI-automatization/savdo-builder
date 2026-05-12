/**
 * FEAT-008-FE: shared компонент звёзд рейтинга. Read-only по умолчанию;
 * передай onChange чтобы превратить в input.
 */
export function Stars({
  value,
  size = 14,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (rating: number) => void;
}) {
  const interactive = !!onChange;
  const filled = Math.round(Math.max(0, Math.min(5, value)));
  return (
    <span
      role={interactive ? 'radiogroup' : undefined}
      aria-label="Рейтинг"
      style={{ display: 'inline-flex', gap: interactive ? 6 : 1, fontSize: size, lineHeight: 1 }}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const isFilled = i <= filled;
        const props = interactive
          ? {
              role: 'radio',
              'aria-checked': isFilled,
              tabIndex: 0,
              onClick: () => onChange?.(i),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange?.(i);
                }
              },
              style: {
                color: isFilled ? '#FBBF24' : 'rgba(255,255,255,0.18)',
                cursor: 'pointer',
                userSelect: 'none' as const,
                fontSize: size * 1.6,
                transition: 'transform 0.1s',
              },
            }
          : { style: { color: isFilled ? '#FBBF24' : 'rgba(255,255,255,0.18)' } };
        return <span key={i} {...props}>★</span>;
      })}
    </span>
  );
}
