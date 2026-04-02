import type { ChatThread, ChatMessage, MessagesResponse, SendMessageRequest } from 'types';
import { apiClient } from './client';

export async function getThreads(): Promise<ChatThread[]> {
  const res = await apiClient.get<ChatThread[]>('/chat/threads');
  return res.data;
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
