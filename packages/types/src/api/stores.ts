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
  // MARKETING-VERIFIED-SELLER-001 trust signals
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

/**
 * Compact store info embedded в product/order responses.
 * API-PRODUCT-STORE-TRUST-SIGNALS-001: включает trust signals чтобы фронт
 * не делал второй request на `/storefront/stores/:slug` ради бейджа/рейтинга.
 */
export interface StoreRef {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  telegramContactLink: string | null;
  logoUrl: string | null;
  // Trust signals — нужны для product page (ProductCard, SellerCard).
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
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
  // MARKETING-VERIFIED-SELLER-001 trust signals (опционально для backward-compat
  // со старыми кэшированными ответами; новые ответы /storefront/stores/:slug
  // их всегда возвращают — см. stores.repository.findBySlug select).
  isVerified?: boolean;
  avgRating?: number | null;
  reviewCount?: number;
}

// ── Global Category ───────────────────────────────────────────────────────────

export interface GlobalCategory {
  id: string;
  parentId: string | null;
  nameRu: string;
  nameUz: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
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
  avatarUrl: string | null;
  createdAt: string;
}

export interface UpdateSellerProfileRequest {
  fullName?: string;
  sellerType?: 'individual' | 'business';
  telegramUsername?: string;
  languageCode?: 'ru' | 'uz';
}
