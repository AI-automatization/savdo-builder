import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { useTelegram } from './TelegramProvider';
import { authenticateWithTelegram, serverLogout, switchContext as apiSwitchContext, type Capabilities } from '@/lib/auth';
import { setUnauthorizedHandler } from '@/lib/api';
import { hydrateWishlist } from '@/lib/wishlist';
import { syncCartToBackend, resetCartSync } from '@/lib/cartSync';

interface User {
  id: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  phone: string | null;
  // HYBRID-6: способности аккаунта для тоггла контекста (продавец/покупатель).
  capabilities?: Capabilities;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  /** Инкрементируется при каждой успешной (ре)аутентификации.
   *  Компоненты добавляют в useEffect deps → авто-перезагрузка после 401 re-auth. */
  authVersion: number;
  logout: () => void;
  reauth: () => Promise<void>;
  /** HYBRID-1: переключение активного контекста (продавец/покупатель) без перелогина.
   *  Возвращает true при успехе. */
  switchContext: (context: 'BUYER' | 'SELLER') => Promise<boolean>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  authenticated: false,
  authVersion: 0,
  logout: () => {},
  reauth: async () => {},
  switchContext: async () => false,
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, isTelegram } = useTelegram();
  // switchContext, как logout/reauth, — функция уровня Provider value, а не часть
  // стейта, поэтому исключаем её из типа стейта (иначе tsc -b требует поле в setState).
  const [state, setState] = useState<Omit<AuthCtx, 'logout' | 'reauth' | 'switchContext'>>({
    user: null, loading: true, authenticated: false, authVersion: 0,
  });
  const reauthingRef = useRef(false);

  const doAuth = useCallback(async () => {
    if (!isTelegram) {
      setState(prev => ({ ...prev, user: null, loading: false, authenticated: false }));
      return;
    }
    const res = await authenticateWithTelegram().catch(() => null);
    if (res) {
      setState(prev => ({
        user: res.user,
        loading: false,
        authenticated: true,
        authVersion: prev.authVersion + 1,
      }));
      // Hydrate wishlist cache for buyers — non-blocking, errors swallowed inside.
      if (res.user.role === 'BUYER') {
        void hydrateWishlist();
        // TMA-CART-API-SYNC-001: одноразовый sync localStorage → backend после login.
        // Idempotent через флаг savdo_cart_synced; sbroshen в logout.
        void syncCartToBackend();
      }
    } else {
      setState(prev => ({ ...prev, user: null, loading: false, authenticated: false }));
    }
  }, [isTelegram]);

  const logout = useCallback(() => {
    void serverLogout(); // A7: invalidates DB session + clears api/wishlist cache
    resetCartSync();
    setState(prev => ({ ...prev, user: null, loading: false, authenticated: false }));
  }, []);

  // HYBRID-1: переключение активного контекста. Обновляет role в state и бампает
  // authVersion → компоненты, завязанные на роль/данные, перезагружаются.
  const switchContext = useCallback(async (context: 'BUYER' | 'SELLER'): Promise<boolean> => {
    const res = await apiSwitchContext(context);
    if (!res) return false;
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, role: res.role } : prev.user,
      authVersion: prev.authVersion + 1,
    }));
    return true;
  }, []);

  useEffect(() => {
    if (!ready) return;
    doAuth();
  }, [ready, doAuth]);

  // При 401 — переаутентифицируемся автоматически.
  // reauthingRef предотвращает параллельные re-auth когда несколько запросов
  // одновременно получают 401 (например при истечении токена).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (reauthingRef.current) return;
      reauthingRef.current = true;
      setState(prev => ({ ...prev, authenticated: false }));
      void doAuth().finally(() => { reauthingRef.current = false; });
    });
  }, [doAuth]);

  return (
    <Ctx.Provider value={{ ...state, logout, reauth: doAuth, switchContext }}>
      {children}
    </Ctx.Provider>
  );
}
