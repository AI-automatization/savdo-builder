import { getTgWebApp } from './telegram';
import { api, setToken, clearApiCache } from './api';
import { clearWishlistCache } from './wishlist';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    phone: string | null;
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
}

/** Переводит текущего BUYER в SELLER.
 *  После вызова нужно сделать reauth() чтобы AuthProvider получил SELLER JWT. */
export async function applyAsSeller(): Promise<void> {
  await api('/seller/apply', { method: 'POST' });
}
