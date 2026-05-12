'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';
import { useAuth } from '../lib/auth/context';
import { orderKeys } from './use-orders';

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

    socket.on('order:status_changed', onOrderStatusChanged);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('order:status_changed', onOrderStatusChanged);
      if (socket.connected) socket.emit('leave-buyer-room', { buyerId });
    };
  }, [user?.id, queryClient]);
}
