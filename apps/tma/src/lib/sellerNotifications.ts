import { connectSocket, getSocket } from './socket';
import { showToast } from '@/components/ui/Toast';
import { api } from './api';

/**
 * TMA-SELLER-WS-NOTIFY-001:
 * Раньше TMA-seller не подписывался на realtime events (`order:new`,
 * `order:status_changed`, `chat:new_message`) — продавец на TG-only терял
 * заказы (узнавал только при ручном открытии Orders). Web-seller имел
 * `useSellerSocket` уже давно; TMA повторяет ту же логику через haptic +
 * showToast (нативные browser Notification в TG WebApp недоступны).
 */

interface OrderEvent {
  id?: string;
  orderNumber?: string;
  totalAmount?: number;
  currencyCode?: string;
  status?: string;
}

interface ChatNewMessageEvent {
  threadId: string;
  buyerName?: string;
}

let bound = false;
let currentStoreId: string | null = null;

interface BindOptions {
  storeId: string;
  /** Вызывается при `order:new` — можно invalidate-нуть локальный кэш orders */
  onOrderNew?: (e: OrderEvent) => void;
  /** Вызывается при `order:status_changed` */
  onOrderStatusChanged?: (e: OrderEvent) => void;
  /** Вызывается при `chat:new_message` (seller получает сообщение от buyer) */
  onChatNewMessage?: (e: ChatNewMessageEvent) => void;
}

function vibrate(pattern: 'success' | 'warning'): void {
  try {
    const tg = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred: (t: 'success' | 'warning' | 'error') => void } } } }).Telegram?.WebApp;
    tg?.HapticFeedback?.notificationOccurred(pattern);
  } catch { /* noop */ }
}

/**
 * Подключает sock + подписывает на seller events. Если уже подключён к тому
 * же storeId — no-op. На смену storeId переподписывает.
 */
export function bindSellerNotifications(opts: BindOptions): void {
  if (bound && currentStoreId === opts.storeId) return;

  const socket = connectSocket();

  // Если предыдущий storeId был другим — снимаем listeners и leave старую room.
  if (bound && currentStoreId && currentStoreId !== opts.storeId) {
    socket.emit('leave-seller-room', { storeId: currentStoreId });
    socket.off('order:new');
    socket.off('order:status_changed');
    socket.off('chat:new_message');
  }

  currentStoreId = opts.storeId;
  bound = true;

  const join = () => socket.emit('join-seller-room', { storeId: opts.storeId });
  if (socket.connected) join(); else socket.once('connect', join);
  socket.on('connect', join); // re-join on reconnect

  socket.on('order:new', (e: OrderEvent) => {
    vibrate('success');
    showToast(`🆕 Новый заказ${e.orderNumber ? ' ' + e.orderNumber : ''}`);
    opts.onOrderNew?.(e);
  });

  socket.on('order:status_changed', (e: OrderEvent) => {
    vibrate('warning');
    showToast(`📦 Статус заказа${e.orderNumber ? ' ' + e.orderNumber : ''} обновлён`);
    opts.onOrderStatusChanged?.(e);
  });

  socket.on('chat:new_message', (e: ChatNewMessageEvent) => {
    vibrate('success');
    showToast(`💬 Сообщение от ${e.buyerName ?? 'покупателя'}`);
    opts.onChatNewMessage?.(e);
  });
}

export function unbindSellerNotifications(): void {
  if (!bound) return;
  const socket = getSocket();
  if (currentStoreId) socket.emit('leave-seller-room', { storeId: currentStoreId });
  socket.off('order:new');
  socket.off('order:status_changed');
  socket.off('chat:new_message');
  bound = false;
  currentStoreId = null;
}

/**
 * Резолвит storeId продавца (один store per seller per INV-S01).
 * Вызывается из SellerLayout после auth.
 */
export async function resolveStoreIdForSeller(): Promise<string | null> {
  try {
    const store = await api<{ id: string } | null>('/seller/store', { method: 'GET' });
    return store?.id ?? null;
  } catch {
    return null;
  }
}
