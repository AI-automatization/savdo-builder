// apps/web-buyer/src/lib/storefront-adapters.ts
//
// Мост между shape'ом /storefront/featured (узкий) и тем,
// что принимает существующий ProductCard (ProductListItem из packages/types).

import type { ProductListItem, FeaturedProduct } from 'types';
import { ProductStatus } from 'types';

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
    // FeaturedProduct API не отдаёт totalStock — featured items презентуются
    // как in-stock (status=ACTIVE+isVisible=true). 1 = «доступно», ProductCard
    // OOS-overlay срабатывает только при `=== 0`.
    totalStock: 1,
    displayType: 'SINGLE',
    inWishlist: undefined,
  };
}
