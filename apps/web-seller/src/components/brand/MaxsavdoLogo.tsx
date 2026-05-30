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
 *
 * Дубль файла web-buyer/src/components/brand/MaxsavdoLogo.tsx — packages/ui
 * пока пустой, поэтому копия. После заведения shared UI package — переносим.
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

// Геометрическая монограмма-сумка по brand-book v2 (logo-app-icon.jpg): угловатая «M»
// из двух штанг с глубокой V-впадиной и острыми miter-углами — левая половина
// theme-adaptive (var(--color-text-primary): чёрная на light, белая на dark), правая
// Champagne Gold (clip x≥50); золотая полукруглая ручка-сумка сидит в центральной
// выемке M. Геометрия сверена визуально с brand-book (Playwright). При точной
// 1:1-векторизации JPG (BRAND-LOGO-SVG-CREATE-001) меняем d-атрибуты — API стабилен.
const M_PATH = 'M 28 81 L 28 32 L 50 73 L 72 32 L 72 81';

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
      {/* Bag handle — gold semicircle nested in the M's central valley */}
      <path
        d="M 39.5 40.5 A 10.5 10.5 0 0 1 60.5 40.5"
        stroke={GOLD}
        strokeWidth="6.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* M base — theme-adaptive (black on light, white on dark) */}
      <path
        d={M_PATH}
        fill="none"
        stroke="var(--color-text-primary)"
        strokeWidth="15"
        strokeLinejoin="miter"
        strokeLinecap="butt"
        strokeMiterlimit={8}
      />
      {/* Right half overlaid in Champagne Gold (clip x≥50) */}
      <path
        d={M_PATH}
        fill="none"
        stroke={GOLD}
        strokeWidth="15"
        strokeLinejoin="miter"
        strokeLinecap="butt"
        strokeMiterlimit={8}
        clipPath={`url(#${RIGHT_CLIP_ID})`}
      />
    </svg>
  );
}
