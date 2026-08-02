// PARTNER-API-RAOS-001: контракт внешнего партнёрского API.
// Auth: заголовок `X-Api-Key` (ключ выдаёт admin через POST /admin/partner-keys).
// Сверено с apps/api/src/modules/partner/partner.controller.ts

/** POST /api/v1/partner/products — тело запроса. */
export interface PartnerCreateProductRequest {
  title: string;
  description?: string;
  basePrice: number;
  /** default 'UZS' */
  currencyCode?: string;
  sku?: string;
  /** ОБЯЗАТЕЛЬНО ≥1 https-URL (jpeg/png/webp, ≤10MB). Товар без фото не принимается. */
  imageUrls: string[];
  /** false → создать DRAFT без публикации. default true. */
  publish?: boolean;
}

/** POST /api/v1/partner/products — ответ 201. */
export interface PartnerCreateProductResponse {
  id: string;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'HIDDEN_BY_ADMIN';
  storeId: string;
  imageCount: number;
  /** Публичная ссылка товара на витрине shop.maxsavdo.uz */
  publicUrl: string;
}

/** GET /api/v1/admin/partner-keys — элемент списка (без hash/plaintext). */
export interface PartnerApiKeyListItem {
  id: string;
  name: string;
  storeId: string;
  isActive: boolean;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  store: { name: string; slug: string };
}

/** POST /api/v1/admin/partner-keys — ответ; `apiKey` показывается ОДИН раз. */
export interface PartnerApiKeyIssueResponse {
  id: string;
  name: string;
  storeId: string;
  apiKey: string;
}
