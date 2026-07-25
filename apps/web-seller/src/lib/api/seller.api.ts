import type {
  SellerProfile,
  UpdateSellerProfileRequest,
  Store,
  GlobalCategory,
  StoreCategory,
  AuthUser,
} from 'types';
import { apiClient } from './client';

// ── Apply Seller (BUYER → SELLER) ──────────────────────────────────────────────

export interface ApplySellerResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function applySeller(): Promise<ApplySellerResponse> {
  const res = await apiClient.post<ApplySellerResponse>('/seller/apply');
  return res.data;
}

// ── Seller Profile ─────────────────────────────────────────────────────────────

export async function getSellerProfile(): Promise<SellerProfile> {
  const res = await apiClient.get<SellerProfile>('/seller/me');
  return res.data;
}

export async function updateSellerProfile(data: UpdateSellerProfileRequest): Promise<SellerProfile> {
  const res = await apiClient.patch<SellerProfile>('/seller/me', data);
  return res.data;
}

// ── Store Management ───────────────────────────────────────────────────────────

export async function getStore(): Promise<Store> {
  const res = await apiClient.get<Store>('/seller/store');
  return res.data;
}

export async function createStore(data: {
  name: string;
  slug?: string;
  description?: string;
  city: string;
  region?: string;
  telegramContactLink: string;
}): Promise<Store> {
  const res = await apiClient.post<Store>('/seller/store', data);
  return res.data;
}

export async function updateStore(data: {
  name?: string;
  description?: string;
  city?: string;
  region?: string;
  telegramContactLink?: string;
  logoMediaId?: string;
  coverMediaId?: string;
  primaryGlobalCategoryId?: string;
  deliveryFeeType?: 'fixed' | 'manual' | 'none';
  deliveryFeeAmount?: number;
}): Promise<Store> {
  const res = await apiClient.patch<Store>('/seller/store', data);
  return res.data;
}

export async function submitStore(): Promise<Store> {
  const res = await apiClient.post<Store>('/seller/store/submit');
  return res.data;
}

export async function publishStore(): Promise<Store> {
  const res = await apiClient.post<Store>('/seller/store/publish');
  return res.data;
}

export async function unpublishStore(): Promise<Store> {
  const res = await apiClient.post<Store>('/seller/store/unpublish');
  return res.data;
}

// ── Categories ─────────────────────────────────────────────────────────────────

export async function getGlobalCategories(): Promise<GlobalCategory[]> {
  const res = await apiClient.get<GlobalCategory[]>('/storefront/categories');
  return res.data;
}

// ── Payment requisites (SELLER-PAYMENT-REQUISITES-001) ──────────────────────────
// Локальные типы: `StorePaymentRequisites`/`UpdateStorePaymentRequisitesRequest`
// определены в packages/types только на main (packages/types/src/api/stores.ts),
// на ветке web-seller их нет — обходной путь как со SlugFeed в web-buyer, см.
// analiz/tasks.md SEO-DOC-DRIFT-001 / ONBOARD-SLUG-TRANSLIT-DEDUP-001. Контракт
// сверен с `apps/api/src/modules/stores/{dto/update-payment-requisites.dto.ts,
// repositories/stores.repository.ts (PAYMENT_REQUISITES_SELECT), stores.controller.ts}`.
export interface RawPaymentRequisites {
  paymentCardNumber: string | null;
  paymentCardHolder: string | null;
  paymentClickLink: string | null;
  paymentPaymeLink: string | null;
  acceptsCash: boolean;
  acceptsCardTransfer: boolean;
}

export interface UpdatePaymentRequisitesRequest {
  cardNumber?: string | null;
  cardHolder?: string | null;
  clickLink?: string | null;
  paymeLink?: string | null;
  acceptsCash?: boolean;
  acceptsCardTransfer?: boolean;
}

export async function getPaymentRequisites(): Promise<RawPaymentRequisites> {
  const res = await apiClient.get<RawPaymentRequisites>('/seller/store/payment-requisites');
  return res.data;
}

export async function updatePaymentRequisites(
  data: UpdatePaymentRequisitesRequest,
): Promise<RawPaymentRequisites> {
  const res = await apiClient.patch<RawPaymentRequisites>('/seller/store/payment-requisites', data);
  return res.data;
}

export async function getStoreCategories(): Promise<StoreCategory[]> {
  const res = await apiClient.get<StoreCategory[]>('/seller/categories');
  return res.data;
}

export async function createStoreCategory(data: { name: string; sortOrder?: number }): Promise<StoreCategory> {
  const res = await apiClient.post<StoreCategory>('/seller/categories', data);
  return res.data;
}

export async function updateStoreCategory(
  id: string,
  data: { name?: string; sortOrder?: number },
): Promise<StoreCategory> {
  const res = await apiClient.patch<StoreCategory>(`/seller/categories/${id}`, data);
  return res.data;
}

export async function deleteStoreCategory(id: string): Promise<void> {
  await apiClient.delete(`/seller/categories/${id}`);
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

export async function uploadSellerAvatar(file: File): Promise<{ avatarUrl: string | null }> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post<{ success: boolean; data: { avatarUrl: string | null } }>(
    '/media/seller/avatar',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data.data;
}
