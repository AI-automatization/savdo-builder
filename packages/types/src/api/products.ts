import { ProductStatus } from '../enums';
import { StoreRef } from './stores';

export type ProductDisplayType = 'SLIDER' | 'SINGLE' | 'COLLAGE_2X2';

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
  currencyCode: string;
  status: ProductStatus;
  isVisible: boolean;
  globalCategoryId: string | null;
  storeCategoryId: string | null;
  mediaUrls: string[];
  variantCount: number;
  displayType: ProductDisplayType;
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
