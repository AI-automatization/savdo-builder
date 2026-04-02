import type { ChatThread, MessagesResponse, SendMessageRequest } from 'types';
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

export async function sendMessage(threadId: string, data: SendMessageRequest): Promise<void> {
  await apiClient.post(`/chat/threads/${threadId}/messages`, data);
}
