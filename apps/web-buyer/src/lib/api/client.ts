'use client';

import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../auth/storage';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== 'undefined') {
  console.warn('[savdo] NEXT_PUBLIC_API_URL not set — API requests go to localhost');
}

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('savdo:auth:expired'));
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken })
          .then(({ data }) => {
            setTokens(data.accessToken, data.refreshToken);
            return data.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(original);
    } catch {
      clearTokens();
      window.dispatchEvent(new CustomEvent('savdo:auth:expired'));
      return Promise.reject(error);
    }
  },
);
