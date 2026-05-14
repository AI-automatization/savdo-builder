// apps/web-buyer/src/types/storefront.ts
//
// Локальные расширения типов для web-buyer пока packages/types не догнан.
// Полат может удалить, когда обновит StoreRef / Store / StorefrontStore
// и добавит FeaturedStorefrontResponse / GlobalCategoryTreeItem.

export interface FeaturedTopStore {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

export interface FeaturedProduct {
  id: string;
  title: string;
  basePrice: number;
  salePrice: number | null;
  isSale: boolean;
  discountPercent: number | null;
  currencyCode: string;
  avgRating: number | null;
  reviewCount: number;
  mediaUrl: string | null;
  store: { id: string; slug: string; name: string };
}

export interface FeaturedStorefrontResponse {
  topStores: FeaturedTopStore[];
  featuredProducts: FeaturedProduct[];
}

/** GlobalCategory с iconEmoji и tree-полями из /storefront/categories/tree. */
export interface GlobalCategoryTreeItem {
  id: string;
  slug: string;
  nameRu: string;
  nameUz: string;
  parentId: string | null;
  level: number;
  isLeaf: boolean;
  iconEmoji: string | null;
  sortOrder: number;
}
