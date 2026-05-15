'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth/context';
import { getInbox, getUnreadCount, readAll } from '../lib/api/notifications.api';
import type { NotificationItem } from '../lib/api/notifications.api';

export const NOTIF_KEYS = {
  inbox: ['notifications', 'inbox'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: NOTIF_KEYS.inbox,
    queryFn: getInbox,
    enabled: isAuthenticated,
    staleTime: 0,
  });
}

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: NOTIF_KEYS.unreadCount,
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 30_000 : false,
    staleTime: 0,
  });
}

export function useReadAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: readAll,
    // Оптимистично помечаем всё прочитанным ДО запроса — иначе после
    // invalidate inbox строки на 1 кадр перерисовываются как unread (flicker).
    onMutate: () => {
      queryClient.setQueryData<NotificationItem[] | undefined>(
        NOTIF_KEYS.inbox,
        (old) => old?.map((n) => ({ ...n, isRead: true })),
      );
      queryClient.setQueryData(NOTIF_KEYS.unreadCount, 0);
    },
    onSuccess: () => {
      queryClient.setQueryData(NOTIF_KEYS.unreadCount, 0);
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.inbox });
    },
  });
}
