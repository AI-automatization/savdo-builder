import { ProductStatus } from '../enums';
import { StoreRef } from './stores';

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
  titleOverride: string | null;
  stockQuantity: number;
}

// ── Product ───────────────────────────────────────────────────────────────────

/** Product in list response (storefront) */
export interface ProductListItem {
  id: string;
  storeId: string;
  title: string;
  description: string | null;
  basePrice: number;
  currencyCode: string;
  status: ProductStatus;
  isVisible: boolean;
  globalCategoryId: string | null;
  storeCategoryId: string | null;
  mediaUrls: string[];
}

/** Full product detail response */
export interface Product extends ProductListItem {
  sku: string | null;
  store: StoreRef;
  variants: ProductVariant[];
  createdAt: string;
}

/** Compact product info embedded in cart item */
export interface ProductRef {
  title: string;
  mediaUrl: string | null;
}
