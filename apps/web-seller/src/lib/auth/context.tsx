'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthUser } from 'types';
import { getAccessToken, setTokens, clearTokens, getStoredUser, storeUser } from './storage';
import { getMe, logout as logoutApi } from '../api/auth.api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const logoutRef = useRef<() => Promise<void>>(async () => {});
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const token = getAccessToken();
    return token ? getStoredUser() : null;
  });

  const login = useCallback(
    (accessToken: string, refreshToken: string, authUser: AuthUser) => {
      setTokens(accessToken, refreshToken);
      storeUser(authUser);
      setUser(authUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort logout
    } finally {
      clearTokens();
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  // Local-only cleanup — used by the savdo:auth:expired handler so we don't
  // re-call /auth/logout (which would 401 and re-fire the same event, looping).
  const localLogout = useCallback(() => {
    clearTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => { logoutRef.current = logout; }, [logout]);

  // Refresh user from server on mount (validates token + gets fresh data)
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    getMe()
      .then((freshUser) => {
        storeUser(freshUser);
        setUser(freshUser);
      })
      .catch(() => {
        // Token is bad — clean local state, no need to call /auth/logout
        // (which would 401 again and fire savdo:auth:expired in a loop).
        localLogout();
      });
  }, [localLogout]);

  useEffect(() => {
    function onExpired() { localLogout(); }
    window.addEventListener('savdo:auth:expired', onExpired);
    return () => window.removeEventListener('savdo:auth:expired', onExpired);
  }, [localLogout]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
