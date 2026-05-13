'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInbox, getUnreadCount, readAll, getPreferences, updatePreferences } from '../lib/api/notifications.api';
import type { NotifPreferences } from '../lib/api/notifications.api';
import { useAuth } from '../lib/auth/context';

export const NOTIF_KEYS = {
  inbox: ['notifications', 'inbox'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: NOTIF_KEYS.inbox,
    queryFn: getInbox,
    staleTime: 0,
    enabled: !!user && user.role === 'SELLER',
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: NOTIF_KEYS.unreadCount,
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    staleTime: 0,
    enabled: !!user && user.role === 'SELLER',
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

export function useNotifPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notifications', 'preferences'] as const,
    queryFn: getPreferences,
    staleTime: 5 * 60 * 1000,
    enabled: !!user && user.role === 'SELLER',
  });
}

export function useUpdateNotifPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<NotifPreferences>) => updatePreferences(prefs),
    onSuccess: (updated) => {
      queryClient.setQueryData(['notifications', 'preferences'], updated);
    },
  });
}
