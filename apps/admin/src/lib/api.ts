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

// API-ADMIN-MFA-UI-DEADLOCK-001: декод JWT нужен здесь, чтобы после refresh
// проверять mfaPending. Если refresh выдал mfaPending=true (admin сессия с
// истёкшим/null mfaVerifiedAt), повторный retry будет 403 MfaEnforcedGuard —
// тогда UI должен редиректить на MFA challenge, а не падать с Session expired.
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
    const json = decodeURIComponent(
      atob(padded).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    )
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

function dispatchMfaRequired() {
  window.dispatchEvent(new CustomEvent('auth:mfa-required'))
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
      // API-ADMIN-MFA-UI-DEADLOCK-001: если refresh вернул mfaPending=true —
      // ретраить нельзя (MfaEnforcedGuard кинет 403 на любом admin endpoint).
      // Просим UI отправить пользователя на MFA challenge через LoginPage.
      const payload = decodeJwtPayload<{ mfaPending?: boolean }>(newToken)
      if (payload?.mfaPending) {
        dispatchMfaRequired()
        throw new Error('MFA required')
      }
      return request<T>(path, {
        ...options,
        headers: { ...options?.headers, Authorization: `Bearer ${newToken}` },
      }, false)
    } catch (e) {
      // MFA required — не очищаем токены: access (с mfaPending) нужен для
      // /admin/auth/mfa/login. LoginPage прочитает access и пойдёт на step 3.
      if (e instanceof Error && e.message === 'MFA required') {
        throw e
      }
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

  const data = await res.json().catch(() => ({}))

  // API-ADMIN-MFA-UI-DEADLOCK-001: 403 с code=MFA_REQUIRED означает что текущий
  // access уже mfaPending (например при первом запросе после refresh без retry).
  // Сигналим UI чтобы LoginPage показал TOTP challenge.
  if (res.status === 403 && data?.code === 'MFA_REQUIRED') {
    dispatchMfaRequired()
    throw new Error('MFA required')
  }

  if (!res.ok) throw new Error(data?.message ?? 'Request failed')
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
