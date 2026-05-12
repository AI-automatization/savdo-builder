// In-app notifications — unread count для badge в BottomNav.
// API-WS-PUSH-NOTIFICATIONS-001: real-time push через socket вместо
// polling каждые 30 сек. Один initial fetch + слушаем `notification:new`.
// Fallback poll оставлен на 5 минут для подстраховки если socket
// потерял соединение и не reconnect'нулся.

import { api, getToken } from './api';
import { connectSocket, getSocket } from './socket';

type Listener = (count: number) => void;

let _count = 0;
let _interval: ReturnType<typeof setInterval> | null = null;
let _socketAttached = false;
const _listeners = new Set<Listener>();

const FALLBACK_POLL_INTERVAL = 5 * 60 * 1000; // 5 мин — на случай WS-разрыва

async function fetchCount(): Promise<void> {
  if (!getToken()) return;
  try {
    const res = await api<{ count: number }>('/notifications/inbox/unread-count', {
      forceFresh: true,
    });
    if (typeof res?.count === 'number' && res.count !== _count) {
      _count = res.count;
      _listeners.forEach((cb) => cb(_count));
    }
  } catch {
    /* tolerable — пропустим */
  }
}

function attachSocket(): void {
  if (_socketAttached || !getToken()) return;
  const socket = connectSocket();
  socket.on('notification:new', () => {
    _count = _count + 1;
    _listeners.forEach((cb) => cb(_count));
  });
  // Когда socket переподключился — синхронизируемся с сервером, чтобы
  // не пропустить notifications упавшие в окне разрыва.
  socket.on('connect', () => { void fetchCount(); });
  _socketAttached = true;
}

function ensureSubscribed(): void {
  attachSocket();
  if (_interval) return;
  void fetchCount(); // первый рендер
  _interval = setInterval(() => { void fetchCount(); }, FALLBACK_POLL_INTERVAL);
}

function maybeStopPolling(): void {
  if (_listeners.size === 0 && _interval) {
    clearInterval(_interval);
    _interval = null;
  }
}

export function subscribeToUnread(cb: Listener): () => void {
  _listeners.add(cb);
  cb(_count); // мгновенно отдаём текущее значение
  ensureSubscribed();
  return () => {
    _listeners.delete(cb);
    maybeStopPolling();
  };
}

export function getUnreadCount(): number {
  return _count;
}

export function setUnreadCount(value: number): void {
  if (value === _count) return;
  _count = Math.max(0, value);
  _listeners.forEach((cb) => cb(_count));
}

export function refreshUnreadCount(): Promise<void> {
  return fetchCount();
}

export function resetNotifications(): void {
  _count = 0;
  _listeners.forEach((cb) => cb(0));
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
  if (_socketAttached) {
    try {
      const s = getSocket();
      s.off('notification:new');
    } catch { /* socket не создан — ок */ }
    _socketAttached = false;
  }
}
