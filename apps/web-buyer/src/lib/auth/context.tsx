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
import { logout as logoutApi } from '../api/auth.api';
import { mergeCart } from '../api/cart.api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => Promise<void>;
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

  useEffect(() => { logoutRef.current = logout; }, [logout]);

  useEffect(() => {
    function onExpired() { logoutRef.current(); }
    window.addEventListener('savdo:auth:expired', onExpired);
    return () => window.removeEventListener('savdo:auth:expired', onExpired);
  }, []);

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
