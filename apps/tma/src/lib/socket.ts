import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? '';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE_URL, {
      autoConnect: false,
      auth: { token: getToken() },
    });
  }
  return socket;
}

export function destroySocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
