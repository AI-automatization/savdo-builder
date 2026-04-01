import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

export function useFetch<T>(path: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.get<T>(path)
      setData(result)
    } catch (e: any) {
      setError(e.message ?? 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps])

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
