// apps/web-buyer/src/components/store/StoreHeroBrandColumn.tsx
//
// Client component — renders the brand-color column in the store hero section.
// Receives already-fetched store data as props; uses useTranslation for i18n.
// This is NOT a Server Component so it can call hooks — but Next.js still SSRs
// it for the initial HTML (no LCP regression).
'use client';

import { Send, Check, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

function pluralReviews(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'отзывов';
  if (mod10 === 1) return 'отзыв';
  if (mod10 >= 2 && mod10 <= 4) return 'отзыва';
  return 'отзывов';
}

interface StoreHeroBrandColumnProps {
  name: string;
  city: string;
  isVerified: boolean | undefined;
  avgRating: number | null;
  reviewCount: number;
  description: string | null | undefined;
  telegramContactLink: string | null | undefined;
}

export function StoreHeroBrandColumn({
  name,
  city,
  isVerified,
  avgRating,
  reviewCount,
  description,
  telegramContactLink,
}: StoreHeroBrandColumnProps) {
  const { t, locale } = useTranslation();

  return (
    <div
      className="px-6 py-8 md:px-8 md:py-10 flex flex-col justify-center"
      style={{ background: colors.brand, color: colors.brandTextOnBg }}
    >
      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70 mb-3">
        {t('store.shopSubLabel', { city })}
      </div>
      <h1 className="text-2xl md:text-4xl font-bold leading-[1.05] tracking-tight mb-3">
        {name}
      </h1>
      {(isVerified || (reviewCount > 0 && avgRating != null)) && (
        <div className="flex items-center gap-3 mb-4 text-[12px]">
          {isVerified && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: 'rgba(251,247,240,0.18)',
                border: '1px solid rgba(251,247,240,0.28)',
                color: colors.brandTextOnBg,
              }}
              aria-label={t('store.verifiedLabel')}
            >
              <Check size={12} strokeWidth={3} aria-hidden />
              <span>{t('store.verified')}</span>
            </span>
          )}
          {reviewCount > 0 && avgRating != null && (
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: colors.brandTextOnBg }}
              aria-label={t('store.ratingAriaLabel', { rating: avgRating.toFixed(1), count: reviewCount })}
            >
              <Star size={13} fill={colors.brandTextOnBg} strokeWidth={0} aria-hidden />
              <span className="font-semibold">{avgRating.toFixed(1)}</span>
              <span className="opacity-75">·</span>
              <span className="opacity-75">
                {reviewCount} {locale === 'uz' ? t('store.reviewWordUz') : pluralReviews(reviewCount)}
              </span>
            </span>
          )}
        </div>
      )}
      {description && (
        <p className="text-sm opacity-85 leading-relaxed mb-5 line-clamp-3 md:line-clamp-4">{description}</p>
      )}
      <div className="flex gap-2.5 flex-wrap">
        <a
          href="#products"
          className="inline-flex items-center justify-center px-5 py-3 text-xs font-bold rounded transition-opacity hover:opacity-90"
          style={{ background: colors.brandTextOnBg, color: colors.brand }}
        >
          {t('store.allProducts')}
        </a>
        {telegramContactLink && (
          <a
            href={telegramContactLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded border transition-opacity hover:opacity-90"
            style={{ borderColor: 'rgba(251,247,240,0.4)', color: colors.brandTextOnBg }}
          >
            <Send size={14} />
            <span>{t('store.chat')}</span>
          </a>
        )}
      </div>
    </div>
  );
}
