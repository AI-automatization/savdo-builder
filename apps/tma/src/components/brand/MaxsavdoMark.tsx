/**
 * maxsavdo brand mark — inline SVG монограмма "M" с bag-handle.
 *
 * Портирован с `apps/web-buyer/src/components/brand/MaxsavdoLogo.tsx`
 * (Азим, brand-book v2). Без зависимостей — чистый SVG.
 *
 * Левая половина M = `var(--tg-text-primary)` (theme-adaptive),
 * правая половина + handle = Champagne Gold #C9A876.
 *
 * TMA-DESIGN-V2-MIGRATE-001, 04.06.2026.
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

export function MaxsavdoMark({ size = 32, className = '', withWordmark = false }: Props) {
  if (withWordmark) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <Mark size={size} />
        <span
          className="font-bold tracking-tight leading-none"
          style={{ color: GOLD, fontSize: size * 0.62 }}
        >
          maxsavdo
        </span>
      </span>
    );
  }
  return <Mark size={size} className={className} />;
}

const LEFT_CLIP_ID = 'maxsavdo-tma-clip-left';
const RIGHT_CLIP_ID = 'maxsavdo-tma-clip-right';

function Mark({ size, className = '' }: { size: number; className?: string }) {
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
      {/* M letterform — left half theme-adaptive */}
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="900"
        fontSize="100"
        fill="var(--tg-text-primary)"
        clipPath={`url(#${LEFT_CLIP_ID})`}
      >
        M
      </text>
      {/* M letterform — right half Champagne Gold */}
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
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
