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

  // 204 No Content — нет тела, возвращаем undefined
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

export async function apiUpload<T = unknown>(
  path: string,
  form: FormData,
  onProgress?: (pct: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText) as T); }
        catch { reject(new ApiError(xhr.status, 'Invalid JSON response')); }
      } else {
        let message = `API error ${xhr.status}`;
        try { message = (JSON.parse(xhr.responseText) as { message?: string }).message ?? message; } catch { /* ignore */ }
        if (xhr.status === 401) { setToken(null); _onUnauthorized?.(); }
        reject(new ApiError(xhr.status, message));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    const base = (import.meta.env.VITE_API_URL as string) ?? '';
    xhr.open('POST', `${base}/api/v1${path}`);
    if (_token) xhr.setRequestHeader('Authorization', `Bearer ${_token}`);
    // НЕ ставить Content-Type — браузер сам добавит multipart/form-data с boundary
    xhr.send(form);
  });
}
