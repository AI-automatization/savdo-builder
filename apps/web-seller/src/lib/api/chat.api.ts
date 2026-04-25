import type { ChatMessage, ChatThread, MessagesResponse, SendMessageRequest } from 'types';
import { apiClient } from './client';

/**
 * Derive display strings for a thread row in the seller's chat list.
 * Seller-side prefers the buyer phone; falls back through product/order/store.
 */
export function getThreadDisplay(t: ChatThread): { title: string; subtitle: string | null } {
  const title =
    t.buyerPhone ??
    t.productTitle ??
    (t.orderNumber ? `Заказ #${t.orderNumber}` : null) ??
    t.storeName ??
    'Покупатель';
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

export async function getMessages(
  threadId: string,
  params?: { limit?: number; before?: string },
): Promise<MessagesResponse> {
  const res = await apiClient.get<MessagesResponse>(`/chat/threads/${threadId}/messages`, { params });
  return res.data;
}

export async function sendMessage(threadId: string, data: SendMessageRequest): Promise<ChatMessage> {
  const res = await apiClient.post<ChatMessage>(`/chat/threads/${threadId}/messages`, data);
  return res.data;
}

export async function resolveThread(threadId: string): Promise<{ id: string; status: string; resolvedAt: string }> {
  const res = await apiClient.patch(`/chat/threads/${threadId}/resolve`);
  return res.data;
}
