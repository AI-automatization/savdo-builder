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

// Stable ID (no Math.random / useId) — одинаковая геометрия у всех instance'ов,
// clipPath name-collision не критичен.
const RIGHT_CLIP_ID = 'maxsavdo-clip-right';

// Геометрическая монограмма-сумка по brand-book v2 (logo-app-icon.jpg): «M» из двух
// штанг — левая половина theme-adaptive (var(--color-text-primary): чёрная на light,
// белая на dark), правая Champagne Gold (clip x≥50); золотая полукруглая ручка-сумка
// парит над впадиной M. Реконструкция растра геометрией; при точной векторизации
// (BRAND-LOGO-SVG-CREATE-001) меняем только d-атрибуты — API компонента стабильно.
const M_PATH = 'M 27 80 L 27 40 L 50 72 L 73 40 L 73 80';

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
        <clipPath id={RIGHT_CLIP_ID}>
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>
      </defs>
      {/* Bag handle — gold semicircle floating above the M valley */}
      <path
        d="M 35 38 A 14.5 14.5 0 0 1 65 38"
        stroke={GOLD}
        strokeWidth="7.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* M base — theme-adaptive (black on light, white on dark) */}
      <path
        d={M_PATH}
        fill="none"
        stroke="var(--color-text-primary)"
        strokeWidth="13"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      {/* Right half overlaid in Champagne Gold (clip x≥50) */}
      <path
        d={M_PATH}
        fill="none"
        stroke={GOLD}
        strokeWidth="13"
        strokeLinejoin="miter"
        strokeLinecap="square"
        clipPath={`url(#${RIGHT_CLIP_ID})`}
      />
    </svg>
  );
}
