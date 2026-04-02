'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SendMessageRequest } from 'types';
import { getThreads, getMessages, sendMessage, resolveThread } from '../lib/api/chat.api';

export const chatKeys = {
  threads: ['chat', 'threads'] as const,
  messages: (threadId: string) => ['chat', 'messages', threadId] as const,
};

export function useThreads() {
  return useQuery({
    queryKey: chatKeys.threads,
    queryFn: getThreads,
  });
}

export function useMessages(threadId: string | null) {
  return useQuery({
    queryKey: chatKeys.messages(threadId ?? ''),
    queryFn: () => getMessages(threadId!),
    enabled: !!threadId,
  });
}

export function useSendMessage(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageRequest) => sendMessage(threadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(threadId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.threads });
    },
  });
}

export function useResolveThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => resolveThread(threadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.threads }),
  });
}
