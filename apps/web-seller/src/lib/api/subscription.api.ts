import type { SubscriptionDto } from 'types';
import { apiClient } from './client';

// ── Subscription ─────────────────────────────────────────────────────────────

export async function getMySubscription(): Promise<SubscriptionDto> {
  const res = await apiClient.get<SubscriptionDto>('/seller/subscription');
  return res.data;
}

export async function cancelMySubscription(reason?: string): Promise<SubscriptionDto> {
  const res = await apiClient.post<SubscriptionDto>('/seller/subscription/cancel', { reason });
  return res.data;
}
