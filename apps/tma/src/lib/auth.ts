import { getTgWebApp } from './telegram';
import { api, setToken, clearApiCache } from './api';
import { clearWishlistCache } from './wishlist';
import { destroySocket } from './socket';
import { resetNotifications } from './notifications';
import { resetPendingOrders } from './pendingOrders';
import { resetChatUnread } from './chatUnread';

export interface Capabilities {
  canBuy: boolean;
  canSell: boolean;
  hasStore: boolean;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    phone: string | null;
    // HYBRID-6: способности аккаунта для тоггла контекста (может отсутствовать
    // у старого API до деплоя — обрабатываем как «нет capabilities»).
    capabilities?: Capabilities;
  };
}

export async function authenticateWithTelegram(): Promise<AuthResponse | null> {
  const tg = getTgWebApp();
  if (!tg?.initData) return null;

  try {
    const data = await api<AuthResponse>('/auth/telegram', {
      method: 'POST',
      body: { initData: tg.initData },
    });
    setToken(data.token);
    return data;
  } catch {
    return null;
  }
}

/**
 * A7: call server logout to invalidate the session in DB, then clear all
 * client-side caches so next user on same device starts clean.
 * Fire-and-forget on network error — local cleanup always happens.
 */
export async function serverLogout(): Promise<void> {
  await api('/auth/logout', { method: 'POST', noCache: true }).catch(() => null);
  setToken(null);
  clearApiCache();
  clearWishlistCache();
  // TMA-WS-STALE-TOKEN-001: рвём WS и сбрасываем in-memory состояние уведомлений —
  // иначе сокет/счётчик утекают к следующему юзеру на этом устройстве.
  resetNotifications();
  resetPendingOrders();
  resetChatUnread();
  destroySocket();
}

/** Переводит текущего BUYER в SELLER.
 *  После вызова нужно сделать reauth() чтобы AuthProvider получил SELLER JWT. */
export async function applyAsSeller(): Promise<void> {
  await api('/seller/apply', { method: 'POST' });
}

/**
 * HYBRID-1: переключает активный контекст (продавец/покупатель) без перелогина.
 * Сервер ре-выдаёт access token с новым role-claim — сохраняем его локально.
 * SELLER требует наличие магазина (иначе сервер вернёт 400).
 */
export async function switchContext(
  context: 'BUYER' | 'SELLER',
): Promise<{ role: 'BUYER' | 'SELLER' } | null> {
  try {
    const data = await api<{ token: string; role: 'BUYER' | 'SELLER'; storeId?: string }>(
      '/auth/switch-context',
      { method: 'POST', body: { context } },
    );
    setToken(data.token);
    // TMA-WS-STALE-TOKEN-001: сокет держит старый токен/контекст — рвём его,
    // следующий connectSocket() поднимется со свежим токеном нового контекста.
    destroySocket();
    return { role: data.role };
  } catch {
    return null;
  }
}
