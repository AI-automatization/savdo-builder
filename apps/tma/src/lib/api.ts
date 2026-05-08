const BASE = import.meta.env.VITE_API_URL ?? '';

const TOKEN_KEY = 'savdo_tma_token';

// ── GET response cache (per-endpoint TTL, module-level) ────────────────────
interface CacheEntry { data: unknown; expiresAt: number; staleAt: number }
const _cache = new Map<string, CacheEntry>();

// Дефолтный TTL для GET. Можно перебить через opts.ttl.
const DEFAULT_TTL = 30_000;
// Stale-окно поверх TTL: после expiresAt, но до expiresAt+STALE_WINDOW
// данные ещё можно показать пользователю + триггернуть refetch в фоне.
const STALE_WINDOW = 5 * 60_000;

// Эвристика TTL по пути. Категории/глобал-данные кешируем дольше.
function inferTTL(path: string): number {
  if (path.startsWith('/storefront/categories')) return 10 * 60_000; // 10 мин
  if (path.startsWith('/storefront/stores'))    return 60_000;       // 1 мин
  if (path.startsWith('/storefront/products'))  return 30_000;       // 30 с
  if (path.startsWith('/stores/'))              return 60_000;       // 1 мин
  if (path.startsWith('/buyer/orders'))         return 10_000;       // 10 с (часто меняется)
  if (path.startsWith('/seller/orders'))        return 10_000;
  if (path.startsWith('/chat/'))                return 5_000;
  return DEFAULT_TTL;
}

export function bustCache(prefix: string) {
  for (const key of _cache.keys()) {
    if (key.includes(prefix)) _cache.delete(key);
  }
}

// ── In-flight dedup ────────────────────────────────────────────────────────
// Если 2 компонента просят один и тот же GET одновременно — делаем один fetch.
const _inflight = new Map<string, Promise<unknown>>();

let _token: string | null = (() => {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
})();

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
  signal?: AbortSignal;       // отмена при unmount/смене параметров
  ttl?: number;               // переопределить TTL для GET
  forceFresh?: boolean;       // обойти кэш (но запись после успеха обновится)
  noCache?: boolean;          // вообще не трогать кэш (write-only ответы)
  timeout?: number;           // ms; default 20_000 (ApiError(408) при истечении)
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function cacheKey(path: string): string {
  return `${_token ?? ''}:${path}`;
}

// Combine user-provided AbortSignal с timeout-AbortSignal так, чтобы ABORT
// от любого из них прервал fetch.
function combineSignals(signals: Array<AbortSignal | undefined>): AbortSignal {
  const ac = new AbortController();
  for (const s of signals) {
    if (!s) continue;
    if (s.aborted) { ac.abort(); break; }
    s.addEventListener('abort', () => ac.abort(), { once: true });
  }
  return ac.signal;
}

const DEFAULT_TIMEOUT_MS = 20_000;

async function doFetch<T>(path: string, opts: ApiOptions, method: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.headers,
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  // Timeout 20с (можно перебить через opts.timeout). Раньше fetch висел вечно
  // при slow backend / DB lock, юзер видел вечный skeleton.
  const timeoutAc = new AbortController();
  const timeoutMs = opts.timeout ?? DEFAULT_TIMEOUT_MS;
  const tid = setTimeout(() => timeoutAc.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1${path}`, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: combineSignals([opts.signal, timeoutAc.signal]),
    });
  } catch (err) {
    clearTimeout(tid);
    // Если timeout сработал, а user-signal не abort'нут — кидаем понятную ошибку.
    if (timeoutAc.signal.aborted && !opts.signal?.aborted) {
      throw new ApiError(408, `Превышено время ожидания (${timeoutMs / 1000}с) — попробуйте ещё раз`);
    }
    throw err;
  }
  clearTimeout(tid);

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      _onUnauthorized?.();
    }
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err.message ?? `API error ${res.status}`);
  }

  // Auto-bust cache на успешный non-GET ответ. Раньше после POST /seller/products
  // старый GET /seller/products оставался в cache 30с → новый товар не появлялся.
  // Bust по path-prefix: /seller/products/abc/status → /seller/products + /seller/products/abc.
  if (method !== 'GET') {
    const cleanPath = path.split('?')[0];
    bustCache(cleanPath);                                  // exact + всё с этим префиксом
    const parent = cleanPath.replace(/\/[^/]+$/, '');
    if (parent && parent !== cleanPath) bustCache(parent);
  }

  if (res.status === 204) return undefined as unknown as T;
  return await res.json() as T;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const isGet = method === 'GET';
  const useCache = isGet && !opts.headers && !opts.noCache;
  const key = cacheKey(path);

  // Чистый кэш-хит — мгновенный ответ
  if (useCache && !opts.forceFresh) {
    const cached = _cache.get(key);
    if (cached && Date.now() < cached.expiresAt) return cached.data as T;
  }

  // Dedup: если уже летит такой же GET — отдаём тот же промис
  if (useCache && !opts.forceFresh) {
    const inflight = _inflight.get(key);
    if (inflight) return inflight as Promise<T>;
  }

  const promise = doFetch<T>(path, opts, method).then((data) => {
    if (useCache && data !== undefined) {
      const ttl = opts.ttl ?? inferTTL(path);
      const now = Date.now();
      _cache.set(key, { data, expiresAt: now + ttl, staleAt: now + ttl + STALE_WINDOW });
    }
    return data;
  }).finally(() => {
    if (useCache) _inflight.delete(key);
  });

  if (useCache) _inflight.set(key, promise as Promise<unknown>);
  return promise;
}

// ── Stale-while-revalidate ────────────────────────────────────────────────
// Колбек onFresh вызывается дважды если есть stale-кэш:
// 1) сразу с кэшем (cache !== undefined)
// 2) с актуальными данными после revalidate
// При сетевой ошибке после первого колбека — второго не будет.
export function apiSWR<T>(
  path: string,
  onFresh: (data: T, fromCache: boolean) => void,
  opts: { signal?: AbortSignal; ttl?: number } = {},
): Promise<T> {
  const key = cacheKey(path);
  const cached = _cache.get(key);
  const now = Date.now();
  if (cached && now < cached.staleAt) {
    onFresh(cached.data as T, true);
    // Если вышло за TTL но в окне stale — подкачаем фоном
    if (now >= cached.expiresAt) {
      api<T>(path, { ...opts, forceFresh: true })
        .then((fresh) => onFresh(fresh, false))
        .catch(() => {/* stale ок */});
      return Promise.resolve(cached.data as T);
    }
    return Promise.resolve(cached.data as T);
  }
  // Кэша нет — обычный путь
  return api<T>(path, opts).then((d) => { onFresh(d, false); return d; });
}

// ── Prefetch ──────────────────────────────────────────────────────────────
// Стартовать запрос заранее (по hover/touchstart) — кэш отработает к моменту навигации.
export function prefetch(path: string): void {
  const key = cacheKey(path);
  const cached = _cache.get(key);
  if (cached && Date.now() < cached.expiresAt) return;
  if (_inflight.has(key)) return;
  api(path).catch(() => {/* prefetch — тихо */});
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
