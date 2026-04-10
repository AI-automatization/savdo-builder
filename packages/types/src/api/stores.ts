import { StoreStatus } from '../enums';

// ── Store ─────────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  region: string | null;
  telegramContactLink: string | null;
  status: StoreStatus;
  logoMediaId: string | null;
  coverMediaId: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  primaryGlobalCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Compact store info embedded in product/order responses */
export interface StoreRef {
  id: string;
  name: string;
  slug: string;
  city: string;
  telegramContactLink: string | null;
  logoUrl: string | null;
}

// ── Storefront Store (публичная витрина — для покупателей и TMA) ──────────────

export interface StorefrontStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  telegramContactLink: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  categories: Pick<StoreCategory, 'id' | 'name' | 'sortOrder'>[];
}

// ── Global Category ───────────────────────────────────────────────────────────

export interface GlobalCategory {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  sortOrder: number;
}

// ── Store Category ────────────────────────────────────────────────────────────

export interface StoreCategory {
  id: string;
  storeId: string;
  name: string;
  sortOrder: number;
}

// ── Seller Profile ────────────────────────────────────────────────────────────

export interface SellerProfile {
  id: string;
  userId: string;
  fullName: string;
  sellerType: 'individual' | 'business';
  telegramUsername: string | null;
  languageCode: 'ru' | 'uz';
  isBlocked: boolean;
  createdAt: string;
}

export interface UpdateSellerProfileRequest {
  fullName?: string;
  sellerType?: 'individual' | 'business';
  telegramUsername?: string;
  languageCode?: 'ru' | 'uz';
}
