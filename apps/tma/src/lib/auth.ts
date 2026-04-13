import { getTgWebApp } from './telegram';
import { api, setToken } from './api';

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

/** Переводит текущего BUYER в SELLER.
 *  После вызова нужно сделать reauth() чтобы AuthProvider получил SELLER JWT. */
export async function applyAsSeller(): Promise<void> {
  await api('/seller/apply', { method: 'POST' });
}
