'use client';

import { useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';
import { useStore } from './use-seller';
import { orderKeys } from './use-orders';

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

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join-seller-room', { storeId: store.id });

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
      const body = payload.buyerName ? `${payload.buyerName} написал(а) вам` : 'Новое сообщение в чате';
      addToast(`💬 ${body}`);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Новое сообщение 💬', { body, icon: '/favicon.ico' });
      }
    }

    socket.on('order:new', onOrderNew);
    socket.on('order:status_changed', onOrderStatusChanged);
    socket.on('chat:new_message', onChatNewMessage);

    return () => {
      socket.off('order:new', onOrderNew);
      socket.off('order:status_changed', onOrderStatusChanged);
      socket.off('chat:new_message', onChatNewMessage);
    };
  }, [store?.id, queryClient, addToast]);

  return { toasts };
}
