import type { ChatMessage, ChatThread, MessagesResponse, SendMessageRequest, CreateThreadRequest } from 'types';
import { apiClient } from './client';

/**
 * Derive display strings for a thread row in the buyer's chat list.
 * Buyer-side prefers the store name; falls back through product/order/phone.
 */
export function getThreadDisplay(t: ChatThread): { title: string; subtitle: string | null } {
  const title =
    t.storeName ??
    t.productTitle ??
    (t.orderNumber ? `Заказ #${t.orderNumber}` : null) ??
    t.buyerPhone ??
    'Чат';
  const subtitle =
    t.threadType === 'ORDER'
      ? t.orderNumber
        ? `Заказ #${t.orderNumber}`
        : null
      : t.productTitle;
  return { title, subtitle };
}

export async function getThreads(): Promise<ChatThread[]> {
  const res = await apiClient.get<ChatThread[]>('/chat/threads');
  return Array.isArray(res.data) ? res.data : [];
}

export async function createThread(data: CreateThreadRequest): Promise<void> {
  await apiClient.post('/chat/threads', data);
}

export async function getMessages(
  threadId: string,
  params?: { limit?: number; before?: string },
): Promise<MessagesResponse> {
  const res = await apiClient.get<MessagesResponse>(`/chat/threads/${threadId}/messages`, { params });
  return res.data;
}

export async function sendMessage(threadId: string, data: SendMessageRequest): Promise<void> {
  await apiClient.post(`/chat/threads/${threadId}/messages`, data);
}

export async function deleteThread(threadId: string): Promise<void> {
  await apiClient.delete(`/chat/threads/${threadId}`);
}

export async function deleteMessage(threadId: string, msgId: string): Promise<void> {
  await apiClient.delete(`/chat/threads/${threadId}/messages/${msgId}`);
}

export async function editMessage(threadId: string, msgId: string, text: string): Promise<ChatMessage> {
  const res = await apiClient.patch<ChatMessage>(`/chat/threads/${threadId}/messages/${msgId}`, { text });
  return res.data;
}
