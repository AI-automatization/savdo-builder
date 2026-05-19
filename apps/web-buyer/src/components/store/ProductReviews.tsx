'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { useProductReviews } from '@/hooks/use-storefront';
import type { ProductReviewItem } from '@/lib/api/storefront.api';
import { colors } from '@/lib/styles';
import { useTranslation } from '@/lib/i18n';

interface ProductReviewsProps {
  productId: string;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-0.5" aria-label={t('product.reviews.ratingLabel', { rating })}>
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
  const [page, setPage] = useState(1);
  // Accumulate pages — нужно и для пагинации, и чтобы средний рейтинг считался
  // по всем отзывам, а не по первой странице (20 шт).
  const [items, setItems] = useState<ProductReviewItem[]>([]);
  const { data, isLoading, isError, isFetching } = useProductReviews(productId, page);
  const { t, locale } = useTranslation();

  // Reset accumulator when product changes
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [productId]);

  // Append each freshly-loaded page (page 1 заменяет, остальные добавляют)
  useEffect(() => {
    if (!data) return;
    setItems((prev) => {
      const base = data.page === 1 ? [] : prev;
      const seen = new Set(base.map((r) => r.id));
      return [...base, ...data.items.filter((r) => !seen.has(r.id))];
    });
  }, [data]);

  const total = data?.total ?? 0;
  const allLoaded = items.length >= total;

  // Точный средний рейтинг доступен только когда загружены ВСЕ отзывы.
  const avgRating = useMemo(() => {
    if (!items.length) return 0;
    return items.reduce((acc, r) => acc + r.rating, 0) / items.length;
  }, [items]);

  if (isError) return null;

  if (isLoading && items.length === 0) {
    return (
      <section className="mb-8">
        <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
          {t('product.reviews.section')}
        </div>
        <div className="rounded-md p-4 max-w-[680px] animate-pulse" style={{ background: colors.surface }}>
          <div className="h-4 w-32 rounded mb-2" style={{ background: colors.surfaceMuted }} />
          <div className="h-3 w-48 rounded" style={{ background: colors.surfaceMuted }} />
        </div>
      </section>
    );
  }

  if (total === 0) {
    return (
      <section className="mb-8">
        <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
          {t('product.reviews.section')}
        </div>
        <div
          className="rounded-md p-4 max-w-[680px] text-sm"
          style={{ background: colors.surface, color: colors.textMuted }}
        >
          {t('product.reviews.empty')}
        </div>
      </section>
    );
  }

  const reviewWord = locale === 'uz' ? t('store.reviewWordUz') : pluralizeReview(total);

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-3 max-w-[680px]">
        <div className="text-[10px] tracking-[0.18em] uppercase" style={{ color: colors.textMuted }}>
          {t('product.reviews.section')}
        </div>
        <div className="flex items-center gap-2">
          {/* Средний рейтинг показываем только когда загружены все отзывы —
              иначе он считался бы по неполной выборке (см. аудит 15.05). */}
          {allLoaded && (
            <>
              <Stars rating={Math.round(avgRating)} />
              <span className="text-sm font-semibold" style={{ color: colors.textStrong }}>
                {avgRating.toFixed(1)}
              </span>
            </>
          )}
          <span className="text-xs" style={{ color: colors.textMuted }}>
            {allLoaded ? '· ' : ''}{total} {reviewWord}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-[680px]">
        {items.map((review) => (
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

      {!allLoaded && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={isFetching}
          className="mt-3 w-full max-w-[680px] py-2.5 text-sm font-semibold rounded-md transition-opacity disabled:opacity-50"
          style={{ background: colors.surface, color: colors.brand, border: `1px solid ${colors.divider}` }}
        >
          {t('product.reviews.showMore')}
        </button>
      )}
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
