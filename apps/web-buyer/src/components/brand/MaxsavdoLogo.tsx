/**
 * maxsavdo brand mark — inline SVG монограмма "M" с bag-handle, по brand-book v2.
 *
 * Mark = монограмма (без текста); wordmark = mark + текст "maxsavdo".
 * Левая половина M использует `var(--color-text-primary)` → автоматически
 * адаптируется к light/dark theme (black на light, white на dark).
 * Правая половина + handle = Champagne Gold (#C9A876).
 *
 * Это inline-приближение для немедленного rollout. Когда Полат закроет
 * BRAND-LOGO-SVG-CREATE-001 (vectorize JPG → точный SVG), заменим внутренности
 * `<MaxsavdoMark/>` на финальные path-данные — API компонента не сломается.
 */

type Props = {
  /** Размер mark'а в пикселях (mark — квадрат). Default 32. */
  size?: number;
  /** Доп. классы для wrapper'а. */
  className?: string;
  /** Показать wordmark "maxsavdo" рядом с mark'ом. Default false. */
  withWordmark?: boolean;
};

const GOLD = '#C9A876';

export function MaxsavdoLogo({ size = 32, className = '', withWordmark = false }: Props) {
  if (withWordmark) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <MaxsavdoMark size={size} />
        <span
          className="font-bold tracking-tight leading-none"
          style={{ color: GOLD, fontSize: size * 0.62 }}
        >
          maxsavdo
        </span>
      </span>
    );
  }
  return <MaxsavdoMark size={size} className={className} />;
}

// Stable IDs (no Math.random / useId) — same component used in multiple sizes на странице;
// id-collision не критичен т.к. clipPath с одинаковым name просто переопределяется,
// все instance'ы используют одинаковую геометрию.
const LEFT_CLIP_ID = 'maxsavdo-clip-left';
const RIGHT_CLIP_ID = 'maxsavdo-clip-right';

function MaxsavdoMark({ size, className = '' }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="maxsavdo"
    >
      <defs>
        <clipPath id={LEFT_CLIP_ID}>
          <rect x="0" y="0" width="50" height="100" />
        </clipPath>
        <clipPath id={RIGHT_CLIP_ID}>
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>
      </defs>
      {/* Bag handle — gold arc above the M letterform */}
      <path
        d="M 35 22 Q 50 4 65 22"
        stroke={GOLD}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* M letterform — left half theme-adaptive (black on light, white on dark) */}
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fontFamily="var(--font-inter), Inter, system-ui, sans-serif"
        fontWeight="900"
        fontSize="100"
        fill="var(--color-text-primary)"
        clipPath={`url(#${LEFT_CLIP_ID})`}
      >
        M
      </text>
      {/* M letterform — right half Champagne Gold */}
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fontFamily="var(--font-inter), Inter, system-ui, sans-serif"
        fontWeight="900"
        fontSize="100"
        fill={GOLD}
        clipPath={`url(#${RIGHT_CLIP_ID})`}
      >
        M
      </text>
    </svg>
  );
}
