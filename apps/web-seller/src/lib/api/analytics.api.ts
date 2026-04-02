import { apiClient } from './client';

export interface SellerSummary {
  views: number;
  topProduct: { productId: string; views: number } | null;
  conversionRate: number;
}

export async function getSellerSummary(): Promise<SellerSummary> {
  const { data } = await apiClient.get<SellerSummary>('/analytics/seller/summary');
  return data;
}
