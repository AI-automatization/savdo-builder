const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000'

// ── Token helpers ─────────────────────────────────────────────────────────────

export const auth = {
  getAccess:  ()        => sessionStorage.getItem('access_token'),
  getRefresh: ()        => localStorage.getItem('refresh_token'),
  setTokens:  (a: string, r: string) => {
    sessionStorage.setItem('access_token', a)
    localStorage.setItem('refresh_token', r)
  },
  clear: () => {
    sessionStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
}

// ── Refresh (singleton promise — предотвращает race condition) ────────────────

let refreshing: Promise<string> | null = null

async function tryRefresh(): Promise<string> {
  if (refreshing) return refreshing

  refreshing = (async () => {
    const refreshToken = auth.getRefresh()
    if (!refreshToken) throw new Error('No refresh token')

    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) throw new Error('Refresh failed')

    const data = await res.json()
    auth.setTokens(data.accessToken, data.refreshToken)
    return data.accessToken as string
  })().finally(() => { refreshing = null })

  return refreshing
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
  const token = auth.getAccess()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (res.status === 401 && retry) {
    try {
      const newToken = await tryRefresh()
      return request<T>(path, {
        ...options,
        headers: { ...options?.headers, Authorization: `Bearer ${newToken}` },
      }, false)
    } catch {
      auth.clear()
      window.dispatchEvent(new CustomEvent('auth:logout'))
      throw new Error('Session expired')
    }
  }

  if (res.status === 401) {
    auth.clear()
    window.dispatchEvent(new CustomEvent('auth:logout'))
    throw new Error('Unauthorized')
  }

  // 204 No Content — нет body, не вызываем res.json() (иначе SyntaxError).
  // DELETE-эндпоинты в API возвращают 204, как и mark-as-read / mark-all-read.
  if (res.status === 204) {
    if (!res.ok) throw new Error('Request failed')
    return undefined as unknown as T
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  get:  <T>(path: string) => request<T>(path),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
