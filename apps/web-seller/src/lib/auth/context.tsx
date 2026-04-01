'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from 'types';
import { getAccessToken, setTokens, clearTokens } from './storage';
import { logout as logoutApi } from '../api/auth.api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) setUser(null);
    // TODO: add GET /auth/me when backend exposes it
  }, []);

  const login = useCallback(
    (accessToken: string, refreshToken: string, authUser: AuthUser) => {
      setTokens(accessToken, refreshToken);
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
