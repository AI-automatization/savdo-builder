'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';
import { useAuth } from '../lib/auth/context';
import { orderKeys } from './use-orders';
import { NOTIF_KEYS } from './use-notifications';
import { chatKeys } from './use-chat';

export function useBuyerSocket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    const buyerId = user.id;

    function joinRoom() {
      socket.emit('join-buyer-room', { buyerId });
    }

    socket.on('connect', joinRoom);

    if (!socket.connected) {
      socket.connect();
    } else {
      joinRoom();
    }

    function onOrderStatusChanged(payload: { id: string; status?: string }) {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(payload.id) });
    }

    // API-WS-PUSH-NOTIFICATIONS-001: backend joins this socket to `user:${userId}`
    // on connect and emits here on every new in-app notification — no separate
    // room-join needed, only a listener (mirrors the seller-side fix).
    function onNotificationNew() {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.inbox });
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.unreadCount });
    }

    // Backend emits this to `user:${userId}` (same auto-joined room as above) on
    // any new chat message across ALL of the buyer's threads, specifically so the
    // thread list can update while only one thread's room is joined via
    // useChatSocket — was emitted but never listened for on this side.
    function onChatUnreadBump() {
      queryClient.invalidateQueries({ queryKey: chatKeys.threads });
    }

    socket.on('order:status_changed', onOrderStatusChanged);
    socket.on('notification:new', onNotificationNew);
    socket.on('chat:unread:bump', onChatUnreadBump);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('order:status_changed', onOrderStatusChanged);
      socket.off('notification:new', onNotificationNew);
      socket.off('chat:unread:bump', onChatUnreadBump);
      if (socket.connected) socket.emit('leave-buyer-room', { buyerId });
    };
  }, [user?.id, queryClient]);
}
