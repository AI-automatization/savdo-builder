import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTelegram } from './TelegramProvider';
import { authenticateWithTelegram } from '@/lib/auth';

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

  useEffect(() => {
    if (!ready) return;

    if (!isTelegram) {
      setState({ user: null, loading: false, authenticated: false });
      return;
    }

    authenticateWithTelegram().then((res) => {
      if (res) {
        setState({ user: res.user, loading: false, authenticated: true });
      } else {
        setState({ user: null, loading: false, authenticated: false });
      }
    });
  }, [ready, isTelegram]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
