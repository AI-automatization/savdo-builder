import type {
  SellerProfile,
  UpdateSellerProfileRequest,
  Store,
  GlobalCategory,
  StoreCategory,
} from 'types';
import { apiClient } from './client';

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
