// In-app notifications — unread count для badge в BottomNav.
// MVP: polling 30 сек. WebSocket push добавим в следующем PR (нужен
// дополнительный gateway).

import { api, getToken } from './api';

type Listener = (count: number) => void;

let _count = 0;
let _interval: ReturnType<typeof setInterval> | null = null;
const _listeners = new Set<Listener>();

const POLL_INTERVAL = 30_000;

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
    /* tolerable — пропустим этот тик */
  }
}

function ensurePolling(): void {
  if (_interval) return;
  // Сразу первый запрос + по таймеру.
  void fetchCount();
  _interval = setInterval(() => { void fetchCount(); }, POLL_INTERVAL);
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
  ensurePolling();
  return () => {
    _listeners.delete(cb);
    maybeStopPolling();
  };
}

export function getUnreadCount(): number {
  return _count;
}

// Вызывается извне когда юзер прочитал уведомления (markAllRead).
export function setUnreadCount(value: number): void {
  if (value === _count) return;
  _count = Math.max(0, value);
  _listeners.forEach((cb) => cb(_count));
}

// Forced refresh — например после фокуса вкладки или захода на /notifications.
export function refreshUnreadCount(): Promise<void> {
  return fetchCount();
}

// Reset при logout.
export function resetNotifications(): void {
  _count = 0;
  _listeners.forEach((cb) => cb(0));
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}
