import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth/storage';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE_URL, {
      autoConnect: false,
      auth: { token: getAccessToken() },
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
