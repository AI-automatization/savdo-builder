// UX-002: Unread count именно для чатов (в дополнение к общим notifications).
// Показывается отдельным числом на иконке «Чат» в BottomNav/Sidebar.
//
// Источник: GET /api/v1/chat/unread-count → { total, threads }.
// Polling каждые 30 сек + immediate refresh при socket-event chat:message.

import { api, getToken } from './api';

type Listener = (count: number) => void;

let _count = 0;
let _interval: ReturnType<typeof setInterval> | null = null;
const _listeners = new Set<Listener>();

const POLL_INTERVAL = 30_000;

async function fetchCount(): Promise<void> {
  if (!getToken()) return;
  try {
    const res = await api<{ total: number; threads: number }>('/chat/unread-count', {
      forceFresh: true,
    });
    const next = typeof res?.total === 'number' ? res.total : 0;
    if (next !== _count) {
      _count = next;
      _listeners.forEach((cb) => cb(_count));
    }
  } catch {
    /* tolerable — следующий polling попробует снова */
  }
}

function ensurePolling(): void {
  if (_interval) return;
  void fetchCount();
  _interval = setInterval(() => { void fetchCount(); }, POLL_INTERVAL);
}

function maybeStopPolling(): void {
  if (_listeners.size === 0 && _interval) {
    clearInterval(_interval);
    _interval = null;
  }
}

export function subscribeToChatUnread(cb: Listener): () => void {
  _listeners.add(cb);
  cb(_count);
  ensurePolling();
  return () => {
    _listeners.delete(cb);
    maybeStopPolling();
  };
}

export function getChatUnreadCount(): number {
  return _count;
}

/** Вызывать после mark-as-read внутри чата чтобы не ждать polling. */
export function refreshChatUnread(): Promise<void> {
  return fetchCount();
}

/** Logout/reset. */
export function resetChatUnread(): void {
  _count = 0;
  _listeners.forEach((cb) => cb(0));
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}
