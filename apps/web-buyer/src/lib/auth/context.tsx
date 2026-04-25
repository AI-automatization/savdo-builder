'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthUser } from 'types';
import {
  getAccessToken,
  setTokens,
  clearTokens,
  getSessionToken,
  clearSessionToken,
  getStoredUser,
  storeUser,
} from './storage';
import { getMe, logout as logoutApi } from '../api/auth.api';
import { mergeCart } from '../api/cart.api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
    async (accessToken: string, refreshToken: string, authUser: AuthUser) => {
      setTokens(accessToken, refreshToken);
      storeUser(authUser);
      setUser(authUser);

      // Merge guest cart into authenticated buyer cart
      const sessionKey = getSessionToken();
      if (sessionKey) {
        try {
          await mergeCart({ sessionKey });
          clearSessionToken();
        } catch {
          // Non-fatal — guest cart may be empty or from a different store
        }
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort logout — clear tokens regardless
    } finally {
      clearTokens();
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  // Local-only cleanup — used by savdo:auth:expired handler so we don't
  // re-call /auth/logout (which would 401 and re-fire the same event, looping).
  const localLogout = useCallback(() => {
    clearTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;
    const fresh = await getMe();
    storeUser(fresh);
    setUser(fresh);
  }, []);

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
        // Bad token — clean local state, no /auth/logout call (avoids loop).
        localLogout();
      });
  }, [localLogout]);

  useEffect(() => {
    function onExpired() { localLogout(); }
    window.addEventListener('savdo:auth:expired', onExpired);
    return () => window.removeEventListener('savdo:auth:expired', onExpired);
  }, [localLogout]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
