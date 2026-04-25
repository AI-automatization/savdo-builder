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

/**
 * Соединяет сокет с актуальным токеном. Безопасно вызывать повторно —
 * если уже подключён, просто возвращает текущий инстанс.
 */
export function connectSocket(): Socket {
  const s = getSocket();
  // Обновляем токен перед подключением (актуально после ре-авторизации)
  (s as Socket & { auth: Record<string, unknown> }).auth = { token: getToken() };
  if (!s.connected) s.connect();
  return s;
}

/**
 * Joins a socket.io room safely — waits for the connection before emitting.
 * Fixes the race condition where join-chat-room fires before handshake completes.
 */
export function joinRoom(socket: Socket, threadId: string): void {
  const emit = () => socket.emit('join-chat-room', { threadId });
  if (socket.connected) {
    emit();
  } else {
    socket.once('connect', emit);
  }
}

export function destroySocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
