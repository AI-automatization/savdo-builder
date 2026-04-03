'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInbox, getUnreadCount, readAll } from '../lib/api/notifications.api';

export const NOTIF_KEYS = {
  inbox: ['notifications', 'inbox'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: NOTIF_KEYS.inbox,
    queryFn: getInbox,
    staleTime: 0,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIF_KEYS.unreadCount,
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function useReadAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: readAll,
    onSuccess: () => {
      queryClient.setQueryData(NOTIF_KEYS.unreadCount, 0);
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.inbox });
    },
  });
}
