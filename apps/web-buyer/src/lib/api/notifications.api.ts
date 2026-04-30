import type { NotificationItem, InboxResponse } from 'types';
import { apiClient } from './client';

export type { NotificationItem, InboxResponse };

export async function getInbox(): Promise<NotificationItem[]> {
  const { data } = await apiClient.get<InboxResponse>('/notifications/inbox', {
    params: { limit: 30 },
  });
  return data.notifications ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>(
    '/notifications/inbox/unread-count',
  );
  return data.count;
}

export async function readAll(): Promise<void> {
  await apiClient.patch('/notifications/inbox/read-all');
}
