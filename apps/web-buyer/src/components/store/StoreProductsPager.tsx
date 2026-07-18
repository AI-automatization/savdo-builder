// apps/web-buyer/src/components/store/StoreProductsPager.tsx
//
// SEO-AUDIT-001 п.16: `/storefront/products?storeId=` пагинирует backend'ом
// (default limit 20) — без этого пейджера товары после первой страницы были
// не показаны и никак не достижимы. Client component только ради t(); hrefs
// приходят готовыми строками с сервера (функции не пересекают server→client).
'use client';

import Link from 'next/link';
import { colors } from '@/lib/styles';
import { useTranslation } from '@/lib/i18n';

interface StoreProductsPagerProps {
  page: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
}

export default function StoreProductsPager({ page, totalPages, prevHref, nextHref }: StoreProductsPagerProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 pt-6" style={{ borderTop: `1px solid ${colors.border}` }}>
      {prevHref ? (
        <Link
          href={prevHref}
          className="px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}`, color: colors.textBody }}
        >
          {t('store.pager.prev')}
        </Link>
      ) : <span />}

      <span className="text-xs" style={{ color: colors.textMuted }}>
        {t('store.pager.pageOf', { page, total: totalPages })}
      </span>

      {nextHref ? (
        <Link
          href={nextHref}
          className="px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: colors.brand, color: colors.brandTextOnBg }}
        >
          {t('store.pager.next')}
        </Link>
      ) : <span />}
    </div>
  );
}
