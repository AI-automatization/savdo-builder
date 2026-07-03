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
import { destroySocket } from '../socket';

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
  // Always start at null (matches the server-rendered tree) — reading localStorage
  // in the lazy initializer would populate this during the hydration render itself
  // and desync from the SSR'd guest-view markup, causing a hydration failure.
  const [user, setUser] = useState<AuthUser | null>(null);

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
      destroySocket();
    }
  }, [queryClient]);

  // Local-only cleanup — used by savdo:auth:expired handler so we don't
  // re-call /auth/logout (which would 401 and re-fire the same event, looping).
  const localLogout = useCallback(() => {
    clearTokens();
    setUser(null);
    queryClient.clear();
    destroySocket();
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;
    const fresh = await getMe();
    storeUser(fresh);
    setUser(fresh);
  }, []);

  useEffect(() => { logoutRef.current = logout; }, [logout]);

  // Hydrate from localStorage post-mount (client-only, avoids SSR/CSR mismatch),
  // then refresh from server to validate the token + get fresh data.
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const stored = getStoredUser();
    if (stored) setUser(stored);
    getMe()
      .then((freshUser) => {
        storeUser(freshUser);
        setUser(freshUser);
      })
      .catch(() => {
        // A genuinely invalid/expired token already triggers `savdo:auth:expired`
        // from the apiClient 401-refresh interceptor (handled below) — don't also
        // log out here, or a network blip / 5xx on a flaky connection would force
        // a valid session out.
      });
  }, [localLogout]);

  useEffect(() => {
    function onExpired() { localLogout(); }
    window.addEventListener('savdo:auth:expired', onExpired);
    return () => window.removeEventListener('savdo:auth:expired', onExpired);
  }, [localLogout]);

  // Cross-tab logout sync — when another tab clears the access token, mirror
  // it here so this tab doesn't keep flashing user-only UI until its next 401.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'savdo_access_token' && !e.newValue) {
        localLogout();
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
