import { apiClient } from './client';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface InboxResponse {
  data: NotificationItem[];
  meta: { page: number; limit: number; total: number };
}

export async function getInbox(): Promise<NotificationItem[]> {
  const { data } = await apiClient.get<InboxResponse>('/notifications/inbox', {
    params: { limit: 30 },
  });
  return data.data;
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
