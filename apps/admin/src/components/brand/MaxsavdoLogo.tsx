/**
 * maxsavdo brand mark — inline SVG монограмма "M" с bag-handle, по brand-book v2.
 *
 * BRAND-ADMIN-REBRAND-001: дубль компонента из apps/web-seller / apps/web-buyer
 * (packages/ui ещё не оформлен — переносим после `BRAND-SHARED-UI-PACKAGE-001`).
 *
 * Mark = монограмма (без текста); wordmark = mark + текст "maxsavdo".
 * Левая половина M использует `var(--text)` → автоматически адаптируется
 * к light/dark theme (Rich Black на light, Pure White на dark).
 * Правая половина + handle = Champagne Gold (#C9A876).
 */

type Props = {
  /** Размер mark'а в пикселях (mark — квадрат). Default 32. */
  size?: number
  /** Доп. классы для wrapper'а. */
  className?: string
  /** Показать wordmark "maxsavdo" рядом с mark'ом. Default false. */
  withWordmark?: boolean
}

const GOLD = '#C9A876'

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
    )
  }
  return <MaxsavdoMark size={size} className={className} />
}

// Stable IDs (no Math.random / useId) — clipPath name collision не критичен,
// все instance'ы используют одинаковую геометрию.
const LEFT_CLIP_ID = 'maxsavdo-admin-clip-left'
const RIGHT_CLIP_ID = 'maxsavdo-admin-clip-right'

export function MaxsavdoMark({ size, className = '' }: { size: number; className?: string }) {
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
      {/* M letterform — left half theme-adaptive (--text: Rich Black on light, Pure White on dark) */}
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="100"
        fill="var(--text)"
        clipPath={`url(#${LEFT_CLIP_ID})`}
      >
        M
      </text>
      {/* M letterform — right half Champagne Gold */}
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="100"
        fill={GOLD}
        clipPath={`url(#${RIGHT_CLIP_ID})`}
      >
        M
      </text>
    </svg>
  )
}
