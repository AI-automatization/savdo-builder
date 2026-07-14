import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth/storage';
import { API_ORIGIN } from './api/env';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_ORIGIN, {
      autoConnect: false,
      auth: (cb) => cb({ token: getAccessToken() ?? '' }),
      // PERF-TMA-HEAT-001 (портировано из apps/tma): дефолт socket.io — бесконечный
      // reconnect. Если хендшейк вечно фейлится (stale token и т.п.), это постоянный
      // CPU-цикл. Ограничиваем попытки + backoff — после лимита сокет уходит в
      // 'disconnected', цикл останавливается. Повторный connectSocket() поднимет заново.
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
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
