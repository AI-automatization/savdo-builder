'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChatThread, MessagesResponse, SendMessageRequest, CreateThreadRequest } from 'types';
import { getThreads, getMessages, sendMessage, createThread, deleteThread, deleteMessage, editMessage } from '../lib/api/chat.api';
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

export function useUnreadChatCount(enabled: boolean): number {
  const { data: threads } = useQuery({
    queryKey: chatKeys.threads,
    queryFn: getThreads,
    staleTime: 30 * 1000,
    enabled,
  });
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
  // the bottom-nav badge updates without waiting for the threads-list staleTime.
  // dataUpdatedAt включён в deps, чтобы effect срабатывал на КАЖДЫЙ успешный
  // refetch (а не только на первый success), иначе после WS-invalidate badge
  // может застрять на >0 если threads refetch вернётся позже messages refetch.
  const isSuccess = query.isSuccess;
  const dataUpdatedAt = query.dataUpdatedAt;
  useEffect(() => {
    if (!isSuccess || !threadId) return;
    queryClient.setQueryData<ChatThread[] | undefined>(chatKeys.threads, (old) =>
      old?.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t)),
    );
  }, [isSuccess, threadId, queryClient, dataUpdatedAt]);

  return query;
}

export function useChatSocket(threadId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!threadId) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('join-chat-room', { threadId });

    function onMessage() {
      // Вкладка свёрнута — НЕ помечаем тред прочитанным: invalidate messages
      // дёрнул бы refetch /messages, а backend авто-помечает read на этот
      // запрос → потеряли бы genuine unread. Обновляем только список тредов.
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        queryClient.invalidateQueries({ queryKey: chatKeys.threads });
        return;
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(threadId!) });
      queryClient.invalidateQueries({ queryKey: chatKeys.threads });
      // User в треде и вкладка активна — сбрасываем unread до refetch'а threads,
      // чтобы bottom-nav badge не «прыгал» пока backend фиксирует read.
      queryClient.setQueryData<ChatThread[] | undefined>(chatKeys.threads, (old) =>
        old?.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t)),
      );
    }

    socket.on('chat:message', onMessage);

    return () => {
      socket.off('chat:message', onMessage);
      if (socket.connected) socket.emit('leave-chat-room', { threadId });
    };
  }, [threadId, queryClient]);
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateThreadRequest) => createThread(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.threads });
    },
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

export function useDeleteThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => deleteThread(threadId),
    onSuccess: (_, threadId) => {
      queryClient.setQueryData<ChatThread[] | undefined>(chatKeys.threads, (old) =>
        old?.filter((t) => t.id !== threadId),
      );
      queryClient.removeQueries({ queryKey: chatKeys.messages(threadId) });
    },
  });
}

export function useDeleteMessage(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (msgId: string) => deleteMessage(threadId, msgId),
    onSuccess: (_, msgId) => {
      queryClient.setQueryData<MessagesResponse | undefined>(chatKeys.messages(threadId), (old) =>
        old
          ? { ...old, messages: old.messages.map((m) => (m.id === msgId ? { ...m, isDeleted: true, text: '' } : m)) }
          : old,
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.threads });
    },
  });
}

export function useEditMessage(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ msgId, text }: { msgId: string; text: string }) => editMessage(threadId, msgId, text),
    onSuccess: (updated) => {
      queryClient.setQueryData<MessagesResponse | undefined>(chatKeys.messages(threadId), (old) =>
        old
          ? {
              ...old,
              messages: old.messages.map((m) =>
                m.id === updated.id ? { ...m, text: updated.text, editedAt: updated.editedAt } : m,
              ),
            }
          : old,
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.threads });
    },
  });
}
