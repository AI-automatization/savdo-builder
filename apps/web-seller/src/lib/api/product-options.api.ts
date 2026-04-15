import type { OptionGroup, OptionValue } from 'types';
import { apiClient } from './client';

// ── Option Groups ─────────────────────────────────────────────────────────────

export async function createOptionGroup(
  productId: string,
  data: { name: string; code: string; sortOrder?: number },
): Promise<OptionGroup> {
  const res = await apiClient.post<OptionGroup>(
    `/seller/products/${productId}/option-groups`,
    data,
  );
  return res.data;
}

export async function updateOptionGroup(
  productId: string,
  groupId: string,
  data: { name?: string; sortOrder?: number },
): Promise<OptionGroup> {
  const res = await apiClient.patch<OptionGroup>(
    `/seller/products/${productId}/option-groups/${groupId}`,
    data,
  );
  return res.data;
}

export async function deleteOptionGroup(productId: string, groupId: string): Promise<void> {
  await apiClient.delete(`/seller/products/${productId}/option-groups/${groupId}`);
}

// ── Option Values ─────────────────────────────────────────────────────────────

export async function createOptionValue(
  productId: string,
  groupId: string,
  data: { value: string; code: string; sortOrder?: number },
): Promise<OptionValue> {
  const res = await apiClient.post<OptionValue>(
    `/seller/products/${productId}/option-groups/${groupId}/values`,
    data,
  );
  return res.data;
}

export async function updateOptionValue(
  productId: string,
  groupId: string,
  valueId: string,
  data: { value?: string; sortOrder?: number },
): Promise<OptionValue> {
  const res = await apiClient.patch<OptionValue>(
    `/seller/products/${productId}/option-groups/${groupId}/values/${valueId}`,
    data,
  );
  return res.data;
}

export async function deleteOptionValue(
  productId: string,
  groupId: string,
  valueId: string,
): Promise<void> {
  await apiClient.delete(
    `/seller/products/${productId}/option-groups/${groupId}/values/${valueId}`,
  );
}
