import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useTelegram } from './TelegramProvider';
import { authenticateWithTelegram } from '@/lib/auth';
import { setUnauthorizedHandler, setToken } from '@/lib/api';

interface User {
  id: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  phone: string | null;
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
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  authenticated: false,
  authVersion: 0,
  logout: () => {},
  reauth: async () => {},
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, isTelegram } = useTelegram();
  const [state, setState] = useState<Omit<AuthCtx, 'logout' | 'reauth'>>({
    user: null, loading: true, authenticated: false, authVersion: 0,
  });

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
    } else {
      setState(prev => ({ ...prev, user: null, loading: false, authenticated: false }));
    }
  }, [isTelegram]);

  const logout = useCallback(() => {
    setToken(null);
    setState(prev => ({ ...prev, user: null, loading: false, authenticated: false }));
  }, []);

  useEffect(() => {
    if (!ready) return;
    doAuth();
  }, [ready, doAuth]);

  // При 401 — переаутентифицируемся автоматически
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setState(prev => ({ ...prev, authenticated: false }));
      doAuth();
    });
  }, [doAuth]);

  return (
    <Ctx.Provider value={{ ...state, logout, reauth: doAuth }}>
      {children}
    </Ctx.Provider>
  );
}
