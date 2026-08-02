import type { CSSProperties, ReactNode } from 'react';

export type PlaceholderVariant =
  | 'no-photo'        // Товар без фото (никогда не было загружено)
  | 'photo-deleted'   // Фото было, но удалено из storage
  | 'load-failed'     // Не удалось загрузить (network/404)
  | 'product-empty'   // Карточка товара без preview
  | 'avatar-empty'    // Аватар не задан
  | 'store-empty'     // Логотип магазина не задан
  | 'thumbnail';      // Маленькая миниатюра (заказ/чат)

interface Props {
  variant?: PlaceholderVariant;
  /** Размер иконки (по умолчанию подбирается под variant). */
  iconSize?: number;
  /** Скрыть подпись (только иконка) — для маленьких миниатюр. */
  hideLabel?: boolean;
  /** Кастомная подпись вместо дефолтной. */
  label?: string;
  /** Inline override стилей контейнера. */
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}

const VARIANT_CONFIG: Record<PlaceholderVariant, { icon: string; label: string }> = {
  'no-photo':       { icon: '📷', label: 'Нет фото' },
  'photo-deleted':  { icon: '🗑',  label: 'Фото удалено' },
  'load-failed':    { icon: '⚠️', label: 'Фото недоступно' },
  'product-empty':  { icon: '📦', label: 'Нет фото' },
  'avatar-empty':   { icon: '👤', label: '' },
  'store-empty':    { icon: '🏪', label: '' },
  'thumbnail':      { icon: '📦', label: '' },
};

export function ImagePlaceholder({
  variant = 'no-photo',
  iconSize,
  hideLabel,
  label,
  style,
  className,
  children,
}: Props) {
  const cfg = VARIANT_CONFIG[variant];
  const finalLabel = label ?? cfg.label;
  const showLabel = !hideLabel && Boolean(finalLabel);
  const finalIconSize = iconSize ?? (variant === 'thumbnail' ? 20 : 32);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background:
          'linear-gradient(135deg, var(--tg-surface) 0%, var(--tg-surface-hover) 100%)',
        border: '1px dashed var(--tg-border-soft)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showLabel ? 6 : 0,
        color: 'var(--tg-text-muted)',
        userSelect: 'none',
        ...style,
      }}
    >
      <span style={{ fontSize: finalIconSize, opacity: 0.55 }}>{cfg.icon}</span>
      {showLabel && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
            opacity: 0.7,
            textAlign: 'center',
            padding: '0 8px',
          }}
        >
          {finalLabel}
        </span>
      )}
      {children}
    </div>
  );
}
