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

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join-buyer-room', { buyerId: user.id });

    function onOrderStatusChanged(payload: { id: string; status?: string }) {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(payload.id) });
    }

    socket.on('order:status_changed', onOrderStatusChanged);

    return () => {
      socket.off('order:status_changed', onOrderStatusChanged);
    };
  }, [user?.id, queryClient]);
}
