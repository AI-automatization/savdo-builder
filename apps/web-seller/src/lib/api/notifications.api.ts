import { apiClient } from './client';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface InboxResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  count: number;
}

export async function getInbox(): Promise<NotificationItem[]> {
  const { data } = await apiClient.get<InboxResponse>('/notifications/inbox', {
    params: { limit: 20 },
  });
  return data.notifications ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<UnreadCountResponse>(
    '/notifications/inbox/unread-count',
  );
  return data.count;
}

export async function readAll(): Promise<void> {
  await apiClient.patch('/notifications/inbox/read-all');
}

export interface NotifPreferences {
  mobilePushEnabled: boolean;
  webPushEnabled: boolean;
  telegramEnabled: boolean;
}

export async function getPreferences(): Promise<NotifPreferences> {
  const { data } = await apiClient.get<NotifPreferences>('/notifications/preferences');
  return data;
}

export async function updatePreferences(prefs: Partial<NotifPreferences>): Promise<NotifPreferences> {
  const { data } = await apiClient.put<NotifPreferences>('/notifications/preferences', prefs);
  return data;
}
