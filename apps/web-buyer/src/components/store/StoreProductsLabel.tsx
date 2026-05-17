// apps/web-buyer/src/components/store/StoreProductsLabel.tsx
//
// Client component — renders the localized "— Товары · N" section header for the
// store products section. Tiny wrapper so the async Server page can use t().
'use client';

import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

interface StoreProductsLabelProps {
  productCount: number;
}

export function StoreProductsLabel({ productCount }: StoreProductsLabelProps) {
  const { t } = useTranslation();
  return (
    <div className="text-[10px] tracking-[0.18em] uppercase" style={{ color: colors.textMuted }}>
      {t('store.productsSection')}{productCount > 0 ? ` · ${productCount}` : ''}
    </div>
  );
}
