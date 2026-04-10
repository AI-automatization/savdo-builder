import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useTelegram } from './TelegramProvider';
import { authenticateWithTelegram } from '@/lib/auth';
import { setUnauthorizedHandler } from '@/lib/api';

interface User {
  id: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  phone: string | null;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, authenticated: false });

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, isTelegram } = useTelegram();
  const [state, setState] = useState<AuthCtx>({ user: null, loading: true, authenticated: false });

  const doAuth = useCallback(async () => {
    if (!isTelegram) {
      setState({ user: null, loading: false, authenticated: false });
      return;
    }
    const res = await authenticateWithTelegram().catch(() => null);
    if (res) {
      setState({ user: res.user, loading: false, authenticated: true });
    } else {
      setState({ user: null, loading: false, authenticated: false });
    }
  }, [isTelegram]);

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

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
