import type { SubscriptionDto } from 'types';
import { apiClient } from './client';

export async function getSubscription(): Promise<SubscriptionDto> {
  const res = await apiClient.get<SubscriptionDto>('/seller/subscription');
  return res.data;
}
