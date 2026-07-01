import { apiClient } from './client';
import type { SubscriptionDto } from 'types';

export async function getSubscription(): Promise<SubscriptionDto> {
  const { data } = await apiClient.get<SubscriptionDto>('/seller/subscription');
  return data;
}
