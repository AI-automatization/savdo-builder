import Link from 'next/link';
import { colors } from '@/lib/styles';

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
}: {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Кнопка-действие (напр. «Повторить» при ошибке). Имеет приоритет над ctaHref. */
  onCta?: () => void;
}) {
  const ctaStyle = {
    background: colors.brand,
    color: colors.brandTextOnBg,
  } as const;
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-semibold mb-1" style={{ color: colors.textBody }}>
        {title}
      </p>
      {description && (
        <p className="text-xs mb-4" style={{ color: colors.textMuted }}>
          {description}
        </p>
      )}
      {ctaLabel && onCta ? (
        <button
          type="button"
          onClick={onCta}
          className="inline-block px-5 py-2 rounded-md text-xs font-semibold"
          style={ctaStyle}
        >
          {ctaLabel}
        </button>
      ) : ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="inline-block px-5 py-2 rounded-md text-xs font-semibold"
          style={ctaStyle}
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
