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

// Backend returns categories shaped { id, nameRu, nameUz, slug, sortOrder, ... }
// but `packages/types#GlobalCategory` still describes `name: string`. Until Полат
// updates the shared type, adapt locally so the seller form selector renders
// labels (Select was showing empty rows because c.name was undefined).
type ApiGlobalCategory = {
  id: string;
  nameRu: string;
  nameUz: string;
  slug: string;
  iconUrl?: string | null;
  sortOrder: number;
};

export async function getGlobalCategories(): Promise<GlobalCategory[]> {
  const res = await apiClient.get<ApiGlobalCategory[]>('/storefront/categories');
  return res.data.map((c) => ({
    id: c.id,
    name: c.nameRu,
    slug: c.slug,
    iconUrl: c.iconUrl ?? null,
    sortOrder: c.sortOrder,
  }));
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
