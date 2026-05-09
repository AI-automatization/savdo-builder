// UX-002 + API-WS-PUSH-NOTIFICATIONS-001: chat-unread badge на иконке «Чат».
// Real-time: socket event `chat:unread:bump` от send-message.use-case.
// Source of truth: GET /chat/unread-count при первой загрузке + reconnect.
// Fallback poll: 5 минут (на случай WS-разрыва без reconnect).

import { api, getToken } from './api';
import { connectSocket, getSocket } from './socket';

type Listener = (count: number) => void;

let _count = 0;
let _interval: ReturnType<typeof setInterval> | null = null;
let _socketAttached = false;
const _listeners = new Set<Listener>();

const FALLBACK_POLL_INTERVAL = 5 * 60 * 1000;

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
    /* tolerable */
  }
}

function attachSocket(): void {
  if (_socketAttached || !getToken()) return;
  const socket = connectSocket();
  socket.on('chat:unread:bump', () => {
    _count = _count + 1;
    _listeners.forEach((cb) => cb(_count));
  });
  socket.on('connect', () => { void fetchCount(); });
  _socketAttached = true;
}

function ensureSubscribed(): void {
  attachSocket();
  if (_interval) return;
  void fetchCount();
  _interval = setInterval(() => { void fetchCount(); }, FALLBACK_POLL_INTERVAL);
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
  ensureSubscribed();
  return () => {
    _listeners.delete(cb);
    maybeStopPolling();
  };
}

export function getChatUnreadCount(): number {
  return _count;
}

/** Вызывается после mark-as-read внутри чата (когда юзер прочитал).
 *  Также вызывает invalidate count'а с сервера (он зануляет тред). */
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
  if (_socketAttached) {
    try {
      const s = getSocket();
      s.off('chat:unread:bump');
    } catch { /* ok */ }
    _socketAttached = false;
  }
}
