'use client';

import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { useProductReviews } from '@/hooks/use-storefront';
import { colors } from '@/lib/styles';

interface ProductReviewsProps {
  productId: string;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Рейтинг ${rating} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? colors.warning : 'transparent'}
          style={{ color: i <= rating ? colors.warning : colors.border }}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data, isLoading, isError } = useProductReviews(productId);

  const avgRating = useMemo(() => {
    if (!data?.items.length) return 0;
    const sum = data.items.reduce((acc, r) => acc + r.rating, 0);
    return sum / data.items.length;
  }, [data]);

  if (isError) return null;

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
          — Отзывы
        </div>
        <div className="rounded-md p-4 max-w-[680px] animate-pulse" style={{ background: colors.surface }}>
          <div className="h-4 w-32 rounded mb-2" style={{ background: colors.surfaceMuted }} />
          <div className="h-3 w-48 rounded" style={{ background: colors.surfaceMuted }} />
        </div>
      </section>
    );
  }

  if (!data || data.total === 0) {
    return (
      <section className="mb-8">
        <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
          — Отзывы
        </div>
        <div
          className="rounded-md p-4 max-w-[680px] text-sm"
          style={{ background: colors.surface, color: colors.textMuted }}
        >
          Пока нет отзывов. Будьте первым после получения заказа.
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-3 max-w-[680px]">
        <div className="text-[10px] tracking-[0.18em] uppercase" style={{ color: colors.textMuted }}>
          — Отзывы
        </div>
        <div className="flex items-center gap-2">
          <Stars rating={Math.round(avgRating)} />
          <span className="text-sm font-semibold" style={{ color: colors.textStrong }}>
            {avgRating.toFixed(1)}
          </span>
          <span className="text-xs" style={{ color: colors.textMuted }}>
            · {data.total} {pluralizeReview(data.total)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-[680px]">
        {data.items.map((review) => (
          <article
            key={review.id}
            className="rounded-md p-4"
            style={{ background: colors.surface, border: `1px solid ${colors.divider}` }}
          >
            <header className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: colors.textStrong }}>
                  {review.authorName}
                </span>
                <Stars rating={review.rating} size={12} />
              </div>
              <time className="text-[11px]" style={{ color: colors.textMuted }} dateTime={review.createdAt}>
                {formatDate(review.createdAt)}
              </time>
            </header>
            {review.comment && (
              <p className="text-sm" style={{ lineHeight: 1.55, color: colors.textBody, whiteSpace: 'pre-wrap' }}>
                {review.comment}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function pluralizeReview(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return 'отзывов';
  if (last === 1) return 'отзыв';
  if (last >= 2 && last <= 4) return 'отзыва';
  return 'отзывов';
}
