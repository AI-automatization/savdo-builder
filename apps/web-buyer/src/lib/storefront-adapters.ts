// apps/web-buyer/src/lib/storefront-adapters.ts
//
// Мост между shape'ом /storefront/featured (узкий) и тем,
// что принимает существующий ProductCard (ProductListItem из packages/types).

import type { ProductListItem } from 'types';
import { ProductStatus } from 'types';
import type { FeaturedProduct } from '@/types/storefront';

/**
 * Расширить featured product до ProductListItem-совместимого объекта.
 * Defaults подобраны так чтобы ProductCard работал без визуальных дефектов
 * (status=ACTIVE, isVisible=true, displayType=SINGLE и т.п.).
 */
export function featuredProductToListItem(f: FeaturedProduct): ProductListItem {
  const mediaUrls = f.mediaUrl ? [f.mediaUrl] : [];
  return {
    id: f.id,
    storeId: f.store.id,
    title: f.title,
    description: null,
    basePrice: f.basePrice,
    oldPrice: null,
    salePrice: f.salePrice,
    isSale: f.isSale,
    discountPercent: f.discountPercent,
    currencyCode: f.currencyCode,
    status: ProductStatus.ACTIVE,
    isVisible: true,
    globalCategoryId: null,
    storeCategoryId: null,
    mediaUrls,
    images: mediaUrls.map((url) => ({ url })),
    variantCount: 0,
    displayType: 'SINGLE',
    inWishlist: undefined,
  };
}
