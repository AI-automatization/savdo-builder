'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SendMessageRequest } from 'types';
import { getThreads, getMessages, sendMessage } from '../lib/api/chat.api';
import { getSocket } from '../lib/socket';

export const chatKeys = {
  threads: ['chat', 'threads'] as const,
  messages: (threadId: string) => ['chat', 'messages', threadId] as const,
};

export function useThreads() {
  return useQuery({
    queryKey: chatKeys.threads,
    queryFn: getThreads,
    staleTime: 30 * 1000,
  });
}

export function useMessages(threadId: string | null) {
  return useQuery({
    queryKey: chatKeys.messages(threadId ?? ''),
    queryFn: () => getMessages(threadId!),
    enabled: !!threadId,
    staleTime: 30 * 1000,
  });
}

export function useChatSocket(threadId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!threadId) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('join-chat-room', { threadId });

    function onMessage() {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(threadId!) });
    }

    socket.on('chat:message', onMessage);

    return () => {
      socket.off('chat:message', onMessage);
    };
  }, [threadId, queryClient]);
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
