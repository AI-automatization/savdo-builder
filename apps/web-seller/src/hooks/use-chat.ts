'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChatThread, SendMessageRequest } from 'types';
import { getThreads, getMessages, sendMessage, resolveThread } from '../lib/api/chat.api';
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

export function useUnreadChatCount(): number {
  const { data: threads } = useThreads();
  if (!threads) return 0;
  return threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);
}

export function useMessages(threadId: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: chatKeys.messages(threadId ?? ''),
    queryFn: () => getMessages(threadId!),
    enabled: !!threadId,
    staleTime: 30 * 1000,
  });

  // Backend auto-marks the thread as read on /messages fetch — mirror locally so
  // the sidebar badge updates without waiting for the threads-list staleTime.
  const isSuccess = query.isSuccess;
  useEffect(() => {
    if (!isSuccess || !threadId) return;
    queryClient.setQueryData<ChatThread[] | undefined>(chatKeys.threads, (old) =>
      old?.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t)),
    );
  }, [isSuccess, threadId, queryClient]);

  return query;
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

export function useChatSocket(threadId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!threadId) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('join-chat-room', { threadId });

    function onMessage() {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(threadId!) });
      queryClient.invalidateQueries({ queryKey: chatKeys.threads });
    }

    socket.on('chat:message', onMessage);

    return () => {
      socket.off('chat:message', onMessage);
    };
  }, [threadId, queryClient]);
}
