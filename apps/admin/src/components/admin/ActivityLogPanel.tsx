import { Shield, History } from 'lucide-react'
import { useState } from 'react'
import { useFetch } from '../../lib/hooks'

export interface AuditEntry {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  actorUserId: string | null
  payload: Record<string, unknown> | null
  createdAt: string
}

const KEY_ACTIONS = [
  'user.SUSPEND', 'user.UNSUSPEND',
  'seller.verified', 'seller.unverified', 'seller.rejected',
  'store.APPROVE', 'store.REJECT', 'store.SUSPEND', 'store.UNSUSPEND', 'store.archive', 'store.restore',
  'admin.created', 'admin.updated', 'admin.removed',
  'product.HIDDEN_BY_ADMIN', 'product.RESTORED_BY_ADMIN',
  'order.refund', 'order.cancelled',
]

function isKeyAction(a: string): boolean {
  return KEY_ACTIONS.some((k) => a.startsWith(k) || a === k)
}

function actionTone(a: string): '#EF4444' | '#10B981' | '#F59E0B' | '#94A3B8' {
  if (a.includes('SUSPEND') || a.includes('REJECT') || a.includes('removed') || a.includes('archive')
      || a.includes('refund') || a.includes('cancelled') || a.includes('HIDDEN')) return '#EF4444'
  if (a.includes('UNSUSPEND') || a.includes('verified') || a.includes('APPROVE')
      || a.includes('RESTORED') || a.includes('restore')) return '#10B981'
  if (a.includes('reject') || a.includes('unverified')) return '#F59E0B'
  return '#94A3B8'
}

/**
 * Универсальная панель истории / activity log на основе audit_log.
 * Используется на UserDetailPage, StoreDetailPage, SellerDetailPage.
 *
 * `entityType` / `entityId` соответствуют тому что пишут use-case'ы в
 * `adminRepo.writeAuditLog`. Tabs: «Важные события» (фильтр по KEY_ACTIONS)
 * и «Вся история».
 */
export function ActivityLogPanel({
  entityType,
  entityId,
  limit = 50,
  emptyText = 'Действия с этой записью пока не зарегистрированы',
}: {
  entityType: 'User' | 'Store' | 'Seller' | 'Order' | 'Product'
  entityId: string | null | undefined
  limit?: number
  emptyText?: string
}) {
  const [tab, setTab] = useState<'key' | 'all'>('key')

  const { data, loading } = useFetch<{ logs: AuditEntry[]; total: number }>(
    entityId ? `/api/v1/admin/audit-log?entityType=${entityType}&entityId=${entityId}&limit=${limit}` : null,
    [entityType, entityId, limit],
  )

  const allLogs = data?.logs ?? []
  const keyLogs = allLogs.filter((l) => isKeyAction(l.action))
  const visible = tab === 'key' ? keyLogs : allLogs

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {(['key', 'all'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            style={{
              flex: 1, padding: '12px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'none',
              color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {t === 'key'
                ? <><Shield size={13} /> Важные события {keyLogs.length > 0 && `(${keyLogs.length})`}</>
                : <><History size={13} /> Вся история {allLogs.length > 0 && `(${allLogs.length})`}</>}
            </span>
          </button>
        ))}
      </div>

      <div style={{ padding: 16, maxHeight: 480, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: '24px 0' }}>
            Загрузка истории…
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: '24px 0' }}>
            {emptyText}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map((entry) => {
              const dotColor = actionTone(entry.action)
              const reason = (entry.payload?.reason as string | undefined) ?? null
              return (
                <div key={entry.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: reason ? 4 : 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all' }}>{entry.action}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(entry.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {reason && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Причина: {reason}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
