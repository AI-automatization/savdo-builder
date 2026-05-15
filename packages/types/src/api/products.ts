import { ProductStatus } from '../enums';
import { StoreRef } from './stores';

export type ProductDisplayType = 'SLIDER' | 'SINGLE' | 'COLLAGE_2X2';

/**
 * Canonical image reference в product responses.
 * API-PRODUCT-IMAGES-FULL-SHAPE-001: `url` всегда заполнен (resolved бэкендом);
 * `id`/`mediaId`/`sortOrder`/`isPrimary` присутствуют в detail-ответах
 * (seller product detail, storefront product detail), но могут отсутствовать
 * в лёгких feed-ответах (storefront list, search).
 */
export interface ProductImageRef {
  url: string;
  id?: string;
  mediaId?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

// ── Option Groups / Values ────────────────────────────────────────────────────

export interface OptionValue {
  id: string;
  optionGroupId: string;
  value: string;
  code: string;
  sortOrder: number;
  createdAt: string;
}

export interface OptionGroup {
  id: string;
  productId: string;
  name: string;
  code: string;
  sortOrder: number;
  createdAt: string;
  values: OptionValue[];
}

// ── Product Variant ───────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  sku: string;
  titleOverride: string | null;
  priceOverride: number | null;
  stockQuantity: number;
  isActive: boolean;
  optionValueIds: string[];
}

/** Compact variant info embedded in cart/order item responses */
export interface VariantRef {
  id: string;
  sku: string | null;
  title: string | null;
}

// ── Product ───────────────────────────────────────────────────────────────────

/** Product in list response (storefront) */
export interface ProductListItem {
  id: string;
  storeId: string;
  title: string;
  description: string | null;
  basePrice: number;
  /** P3-004: original price before discount, null if not on sale. */
  oldPrice?: number | null;
  /** P3-004: current sale price, null if not on sale. */
  salePrice?: number | null;
  /** P3-004: true when `salePrice < basePrice`. UI рендерит SALE-бэйдж. */
  isSale: boolean;
  /** P3-004: скидка % (floor, 1..99). null если !isSale. UI рендерит `-30%`. */
  discountPercent: number | null;
  currencyCode: string;
  status: ProductStatus;
  isVisible: boolean;
  globalCategoryId: string | null;
  storeCategoryId: string | null;
  /**
   * Convenience: плоский массив URL-ов в порядке sortOrder. Для UI которому
   * нужен только URL (карточка товара).
   * API-PRODUCT-LIST-IMAGES-CONTRACT-001 (08.05.2026): оба поля заполняются
   * на API всегда — клиент выбирает удобное.
   */
  mediaUrls: string[];
  /**
   * Canonical image objects.
   * API-PRODUCT-IMAGES-FULL-SHAPE-001 (от Азима, web-sync audit 14.05.2026):
   * расширено с `{ url }` до полного shape — `id`/`mediaId`/`sortOrder`
   * опциональны (storefront feed может отдавать только url, product detail —
   * всё). web-seller edit page больше не нуждается в `as` cast.
   */
  images: ProductImageRef[];
  variantCount: number;
  displayType: ProductDisplayType;
  /**
   * True when the current authenticated buyer has this product in their wishlist.
   * Only set on storefront feed responses for authenticated buyers; undefined
   * otherwise (anonymous storefront, seller-side responses).
   */
  inWishlist?: boolean;
}

export interface ProductAttribute {
  id: string;
  name: string;
  value: string;
  sortOrder: number;
}

/** Full product detail response */
export interface Product extends ProductListItem {
  sku: string | null;
  store: StoreRef;
  variants: ProductVariant[];
  optionGroups: OptionGroup[];
  attributes: ProductAttribute[];
  createdAt: string;
  globalCategory: { id: string; nameRu: string; nameUz: string } | null;
}

/** Compact product info embedded in cart item */
export interface ProductRef {
  title: string;
  mediaUrl: string | null;
}
