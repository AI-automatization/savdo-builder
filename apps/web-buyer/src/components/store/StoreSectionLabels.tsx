// apps/web-buyer/src/components/store/StoreSectionLabels.tsx
//
// Client component — renders the localized category chip strip for the store page.
// Receives pre-computed hrefs as plain serializable props (functions cannot cross
// the server→client boundary in Next.js App Router).
'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

export interface StoreCategoryItem {
  id: string;
  name: string;
  sortOrder: number;
  href: string;
}

interface StoreSectionLabelsProps {
  categories: StoreCategoryItem[];
  activeCategoryId: string | undefined;
  allCategoryHref: string;
}

export function StoreSectionLabels({
  categories,
  activeCategoryId,
  allCategoryHref,
}: StoreSectionLabelsProps) {
  const { t } = useTranslation();

  if (categories.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="flex justify-between items-baseline mb-3">
        <div className="text-[10px] tracking-[0.18em] uppercase" style={{ color: colors.textMuted }}>
          {t('store.byCategory')}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        <Link
          href={allCategoryHref}
          className="flex-shrink-0 px-4 py-2 text-xs font-semibold rounded transition-colors"
          style={
            !activeCategoryId
              ? { background: colors.textStrong, color: colors.brandTextOnBg, border: `1px solid ${colors.textStrong}` }
              : { background: colors.surface, color: colors.textBody, border: `1px solid ${colors.border}` }
          }
        >
          {t('store.allCategory')}
        </Link>
        {categories
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((cat) => {
            const isActive = activeCategoryId === cat.id;
            return (
              <Link
                key={cat.id}
                href={cat.href}
                className="flex-shrink-0 px-4 py-2 text-xs font-semibold rounded transition-colors"
                style={
                  isActive
                    ? { background: colors.textStrong, color: colors.brandTextOnBg, border: `1px solid ${colors.textStrong}` }
                    : { background: colors.surface, color: colors.textBody, border: `1px solid ${colors.border}` }
                }
              >
                {cat.name}
              </Link>
            );
          })}
      </div>
    </section>
  );
}
