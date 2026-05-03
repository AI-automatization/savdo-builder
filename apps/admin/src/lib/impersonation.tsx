import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'admin-impersonation'
const ORIGINAL_TOKEN_KEY = 'admin-original-access'
const ORIGINAL_REFRESH_KEY = 'admin-original-refresh'

export interface ImpersonationInfo {
  userId: string
  userPhone: string
  userName?: string | null
  startedAt: string
}

interface Ctx {
  info: ImpersonationInfo | null
  start: (info: ImpersonationInfo, originalAccess: string, originalRefresh: string | null) => void
  stop: () => void
  getOriginalTokens: () => { access: string | null; refresh: string | null }
}

const ImpersonationContext = createContext<Ctx | null>(null)

function readInfo(): ImpersonationInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ImpersonationInfo
  } catch {
    return null
  }
}

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [info, setInfo] = useState<ImpersonationInfo | null>(() => readInfo())

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setInfo(readInfo())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const start = useCallback((next: ImpersonationInfo, originalAccess: string, originalRefresh: string | null) => {
    sessionStorage.setItem(ORIGINAL_TOKEN_KEY, originalAccess)
    if (originalRefresh) localStorage.setItem(ORIGINAL_REFRESH_KEY, originalRefresh)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setInfo(next)
  }, [])

  const stop = useCallback(() => {
    sessionStorage.removeItem(ORIGINAL_TOKEN_KEY)
    localStorage.removeItem(ORIGINAL_REFRESH_KEY)
    localStorage.removeItem(STORAGE_KEY)
    setInfo(null)
  }, [])

  const getOriginalTokens = useCallback(() => ({
    access: sessionStorage.getItem(ORIGINAL_TOKEN_KEY),
    refresh: localStorage.getItem(ORIGINAL_REFRESH_KEY),
  }), [])

  return (
    <ImpersonationContext.Provider value={{ info, start, stop, getOriginalTokens }}>
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonation(): Ctx {
  const ctx = useContext(ImpersonationContext)
  if (!ctx) throw new Error('useImpersonation must be used within ImpersonationProvider')
  return ctx
}
