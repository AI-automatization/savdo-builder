'use client';

import { useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';
import { useStore } from './use-seller';
import { orderKeys } from './use-orders';
import { chatKeys } from './use-chat';
import { NOTIF_KEYS } from './use-notifications';

export interface ToastMessage {
  id: number;
  text: string;
}

export function useSellerSocket() {
  const queryClient = useQueryClient();
  const { data: store } = useStore();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Request browser notification permission once
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!store?.id) return;

    const socket = getSocket();
    const storeId = store.id;

    function joinRoom() {
      socket.emit('join-seller-room', { storeId });
    }

    // Re-join on reconnect so we don't miss events after network blips
    socket.on('connect', joinRoom);

    if (!socket.connected) {
      socket.connect();
    } else {
      joinRoom();
    }

    function onOrderNew(payload: { id: string }) {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      const label = `#${payload.id.slice(-6).toUpperCase()}`;
      addToast(`Новый заказ ${label}`);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Новый заказ 📦', {
          body: `Заказ ${label} ожидает подтверждения`,
          icon: '/favicon.ico',
        });
      }
    }

    function onOrderStatusChanged(payload: { id: string; status?: string }) {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(payload.id) });
      if (payload.status === 'CANCELLED') {
        const label = `#${payload.id.slice(-6).toUpperCase()}`;
        addToast(`Заказ ${label} отменён покупателем`);
      }
    }

    function onChatNewMessage(payload: { threadId: string; buyerName?: string }) {
      // The seller may be on any page other than this exact open thread (that
      // case is handled by useChatSocket) — invalidate here too so the sidebar
      // unread badge updates immediately instead of waiting for an unrelated
      // refetch (tab refocus, navigation).
      queryClient.invalidateQueries({ queryKey: chatKeys.threads });
      const body = payload.buyerName ? `${payload.buyerName} написал(а) вам` : 'Новое сообщение в чате';
      addToast(`💬 ${body}`);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Новое сообщение 💬', { body, icon: '/favicon.ico' });
      }
    }

    // API-WS-PUSH-NOTIFICATIONS-001: backend joins this socket to `user:${userId}`
    // on connect (chat.gateway.ts handleConnection) and emits here on every new
    // in-app notification — no separate room-join needed, only a listener.
    function onNotificationNew(payload: { id: string; type: string; title: string; body: string }) {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.inbox });
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.unreadCount });
      addToast(`🔔 ${payload.title}`);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(payload.title, { body: payload.body, icon: '/favicon.ico' });
      }
    }

    socket.on('order:new', onOrderNew);
    socket.on('order:status_changed', onOrderStatusChanged);
    socket.on('chat:new_message', onChatNewMessage);
    socket.on('notification:new', onNotificationNew);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('order:new', onOrderNew);
      socket.off('order:status_changed', onOrderStatusChanged);
      socket.off('chat:new_message', onChatNewMessage);
      socket.off('notification:new', onNotificationNew);
    };
  }, [store?.id, queryClient, addToast]);

  return { toasts };
}
