import { useState } from 'react'
import { UserCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { useImpersonation } from '../../lib/impersonation'
import { auth, api } from '../../lib/api'

export function ImpersonationBanner() {
  const { info, stop, getOriginalTokens } = useImpersonation()
  const [stopping, setStopping] = useState(false)

  if (!info) return null

  const handleStop = async () => {
    setStopping(true)
    try {
      try {
        await api.post('/api/v1/admin/auth/stop-impersonate', {})
      } catch {
        // Even if API fails, restore tokens locally
      }
      const original = getOriginalTokens()
      if (original.access) {
        auth.setTokens(original.access, original.refresh ?? '')
      } else {
        auth.clear()
      }
      stop()
      toast.success('Возврат к админскому аккаунту')
      setTimeout(() => window.location.assign('/dashboard'), 200)
    } catch (e: any) {
      toast.error(e.message ?? 'Не удалось вернуться')
    } finally {
      setStopping(false)
    }
  }

  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
        padding: '10px 20px',
        background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
        color: '#1F2937',
        fontSize: 13, fontWeight: 600,
        borderBottom: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <UserCheck size={16} />
      <span>
        Сейчас вы как <strong>{info.userName || info.userPhone}</strong> · ID: <code style={{ fontFamily: 'monospace' }}>{info.userId}</code>
      </span>
      <button
        onClick={handleStop}
        disabled={stopping}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          height: 28, padding: '0 12px', borderRadius: 6, border: 'none',
          background: 'rgba(31,41,55,0.9)', color: 'white',
          fontSize: 12, fontWeight: 700, cursor: stopping ? 'wait' : 'pointer',
          marginLeft: 8,
        }}
      >
        <X size={12} /> {stopping ? 'Возврат...' : 'Вернуться к админу'}
      </button>
    </div>
  )
}
