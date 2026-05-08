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

// FEAT-006-FE — Полат `7a3ca26`. Order/revenue analytics, max 90 day window.
export interface DailyPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface AnalyticsTopProduct {
  productId: string | null;
  title: string;
  quantity: number;
  revenue: number;
}

export interface SellerAnalytics {
  range: { from: string; to: string };
  revenue: { total: number; completed: number; pending: number };
  orders: { total: number; byStatus: Record<string, number> };
  topProducts: AnalyticsTopProduct[];
  daily: DailyPoint[];
}

export async function getSellerAnalytics(params: { from: string; to: string }): Promise<SellerAnalytics> {
  const { data } = await apiClient.get<SellerAnalytics>('/seller/analytics', {
    params: { from: params.from, to: params.to },
  });
  return data;
}
