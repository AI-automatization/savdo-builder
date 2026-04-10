const BASE = import.meta.env.VITE_API_URL ?? '';

const TOKEN_KEY = 'savdo_tma_token';

let _token: string | null = (() => {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
})();

// Callback вызывается когда 401 — провайдер переаутентифицирует
let _onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(cb: () => void) { _onUnauthorized = cb; }

export function setToken(token: string | null) {
  _token = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* SSR or private browsing */ }
}
export function getToken() { return _token; }

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.headers,
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      _onUnauthorized?.();
    }
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err.message ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}
