// apps/web-buyer/src/components/store/StoreRating.tsx
import { Star } from 'lucide-react';
import { colors } from '@/lib/styles';

interface Props {
  rating: number | null;
  reviewCount: number;
  /** Если 0 reviews — компонент не рендерится. */
  hideWhenEmpty?: boolean;
  size?: 'sm' | 'md';
}

function pluralReviews(n: number): string {
  // 1 отзыв, 2-4 отзыва, 5+ отзывов, 11-14 → отзывов
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'отзывов';
  if (mod10 === 1) return 'отзыв';
  if (mod10 >= 2 && mod10 <= 4) return 'отзыва';
  return 'отзывов';
}

export function StoreRating({ rating, reviewCount, hideWhenEmpty = true, size = 'sm' }: Props) {
  if (hideWhenEmpty && reviewCount === 0) return null;
  if (rating == null) return null;

  const formatted = rating.toFixed(1);
  const px = size === 'sm' ? 11 : 13;
  const iconPx = size === 'sm' ? 12 : 14;

  return (
    <span
      className="inline-flex items-center gap-1"
      style={{ color: colors.textMuted, fontSize: px }}
      aria-label={`Рейтинг ${formatted} из 5, ${reviewCount} ${pluralReviews(reviewCount)}`}
    >
      <Star size={iconPx} fill={colors.warning} strokeWidth={0} aria-hidden />
      <span style={{ color: colors.textBody, fontWeight: 600 }}>{formatted}</span>
      <span aria-hidden>·</span>
      <span>{reviewCount} {pluralReviews(reviewCount)}</span>
    </span>
  );
}
