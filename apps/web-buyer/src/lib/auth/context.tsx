'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from 'types';
import {
  getAccessToken,
  setTokens,
  clearTokens,
  getSessionToken,
  clearSessionToken,
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
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Restore auth state from token presence
    // Full user info would require a /me endpoint — for now we parse from JWT or skip
    const token = getAccessToken();
    if (!token) setUser(null);
    // TODO: add GET /auth/me when backend exposes it
  }, []);

  const login = useCallback(
    async (accessToken: string, refreshToken: string, authUser: AuthUser) => {
      setTokens(accessToken, refreshToken);
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
    }
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
