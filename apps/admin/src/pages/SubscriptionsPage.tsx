import { useState } from 'react'
import { CreditCard, Search, User } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { useTranslation } from '../lib/i18n'
import { PaginationBar } from '../components/admin/PaginationBar'
import SubscriptionDetailModal from './SubscriptionDetailModal'

// BILLING-MACHINE-001 — admin subscriptions page.
// Локальные типы зеркалят `packages/types/src/api/subscriptions.ts` —
// admin не подключает `@savdo/types` как npm-зависимость, поэтому копируем
// форму DTO. Источник правды — apps/api subscription module.

type SubscriptionTier = 'STARTER' | 'PRO' | 'BUSINESS'
type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CHURNED' | 'CANCELLED'

interface AdminSubscriptionListItem {
  id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  trialEndsAt: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  graceEndsAt: string | null
  cancelAtPeriodEnd: boolean
  daysLeft: number | null
  seller: { id: string; fullName: string; telegramUsername: string }
  cancelledAt: string | null
  suspendedAt: string | null
  updatedAt: string
}

interface AdminSubscriptionListResponse {
  items: AdminSubscriptionListItem[]
  total: number
  page: number
  limit: number
}

// Color-coded badges. Champagne Gold #C9A876 (Dark Luxury) — для активных тиров,
// остальные — стандартная палитра Liquid Authority.
const STATUS_CFG: Record<SubscriptionStatus, { bg: string; text: string; labelKey: string }> = {
  ACTIVE:    { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', labelKey: 'subscriptions.statusActive' },
  TRIAL:     { bg: 'rgba(59,130,246,0.12)',  text: '#60A5FA', labelKey: 'subscriptions.statusTrial' },
  PAST_DUE:  { bg: 'rgba(245,158,11,0.14)',  text: '#F59E0B', labelKey: 'subscriptions.statusPastDue' },
  SUSPENDED: { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', labelKey: 'subscriptions.statusSuspended' },
  CHURNED:   { bg: 'rgba(148,163,184,0.14)', text: '#94A3B8', labelKey: 'subscriptions.statusChurned' },
  CANCELLED: { bg: 'rgba(148,163,184,0.14)', text: '#94A3B8', labelKey: 'subscriptions.statusCancelled' },
}

const TIER_CFG: Record<SubscriptionTier, { bg: string; text: string; labelKey: string }> = {
  STARTER:  { bg: 'rgba(148,163,184,0.14)', text: '#94A3B8', labelKey: 'subscriptions.tierStarter' },
  PRO:      { bg: 'rgba(201,168,118,0.14)', text: '#C9A876', labelKey: 'subscriptions.tierPro' },
  BUSINESS: { bg: 'rgba(201,168,118,0.22)', text: '#E0C896', labelKey: 'subscriptions.tierBusiness' },
}

const STATUS_OPTIONS: SubscriptionStatus[] = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CHURNED', 'CANCELLED']
const TIER_OPTIONS: SubscriptionTier[] = ['STARTER', 'PRO', 'BUSINESS']

export default function SubscriptionsPage() {
  const { t, locale } = useTranslation()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<SubscriptionStatus | ''>('')
  const [tier, setTier] = useState<SubscriptionTier | ''>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const LIMIT = 20
  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
  if (status) params.set('status', status)
  if (tier)   params.set('tier', tier)
  if (search) params.set('search', search)

  const { data, loading, refetch } = useFetch<AdminSubscriptionListResponse>(
    `/api/v1/admin/subscriptions?${params}`,
    [page, status, tier, search],
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  const handleSearch = () => { setSearch(searchInput.trim()); setPage(1) }
  const handleClearSearch = () => { setSearch(''); setSearchInput(''); setPage(1) }

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString(locale === 'uz' ? 'uz-UZ' : 'ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CreditCard size={20} color="#C9A876" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
            {t('subscriptions.title')}
          </h1>
          {total > 0 && (
            <span style={{
              padding: '2px 10px', borderRadius: 20,
              background: 'rgba(201,168,118,0.14)', color: '#C9A876',
              fontSize: 12, fontWeight: 700,
            }}>
              {total}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t('subscriptions.searchPlaceholder')}
              style={{
                paddingLeft: 32, paddingRight: 12, height: 34, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface2)',
                color: 'var(--text)', fontSize: 13, outline: 'none', width: 260,
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            style={{
              height: 34, padding: '0 14px', borderRadius: 8, border: 'none',
              background: '#C9A876', color: '#1a1a1a',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('common.find')}
          </button>
          {search && (
            <button
              onClick={handleClearSearch}
              style={{
                height: 34, padding: '0 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface2)',
                color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
              }}
            >
              {t('common.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Status filter row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => { setStatus(''); setPage(1) }}
          style={pillStyle(status === '')}
        >
          {t('subscriptions.allStatuses')}
        </button>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            style={pillStyle(status === s)}
          >
            {t(STATUS_CFG[s].labelKey)}
          </button>
        ))}
      </div>

      {/* Tier filter row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => { setTier(''); setPage(1) }}
          style={pillStyle(tier === '')}
        >
          {t('subscriptions.allTiers')}
        </button>
        {TIER_OPTIONS.map(tr => (
          <button
            key={tr}
            onClick={() => { setTier(tr); setPage(1) }}
            style={pillStyle(tier === tr)}
          >
            {t(TIER_CFG[tr].labelKey)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                t('subscriptions.colSeller'),
                t('subscriptions.colTier'),
                t('subscriptions.colStatus'),
                t('subscriptions.colPeriodEnd'),
                t('subscriptions.colDaysLeft'),
                '',
              ].map((col, i) => (
                <th key={i} style={{
                  padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  {t('subscriptions.notFound')}
                </td>
              </tr>
            )}
            {items.map((sub, i) => {
              const statusCfg = STATUS_CFG[sub.status] ?? STATUS_CFG.ACTIVE
              const tierCfg = TIER_CFG[sub.tier] ?? TIER_CFG.STARTER
              return (
                <tr
                  key={sub.id}
                  style={{
                    borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                  onClick={() => setSelectedId(sub.id)}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User size={13} color="var(--text-muted)" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>
                          {sub.seller.fullName || '—'}
                        </span>
                        {sub.seller.telegramUsername && (
                          <span style={{ color: 'var(--text-dim)', fontSize: 11, fontFamily: 'monospace' }}>
                            @{sub.seller.telegramUsername}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: tierCfg.bg, color: tierCfg.text,
                    }}>
                      {t(tierCfg.labelKey)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: statusCfg.bg, color: statusCfg.text,
                    }}>
                      {t(statusCfg.labelKey)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {fmtDate(sub.currentPeriodEnd)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {sub.daysLeft === null
                      ? '—'
                      : (
                        <span style={{
                          color: sub.daysLeft <= 3
                            ? '#EF4444'
                            : sub.daysLeft <= 7
                              ? '#F59E0B'
                              : 'var(--text-muted)',
                          fontWeight: 600,
                        }}>
                          {sub.daysLeft} {t('subscriptions.daysShort')}
                        </span>
                      )
                    }
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: '#C9A876', fontWeight: 700 }}>→</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 16 }}>
          <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      )}

      {/* Detail modal */}
      {selectedId && (
        <SubscriptionDetailModal
          subscriptionId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => { refetch() }}
        />
      )}
    </div>
  )
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    height: 32, padding: '0 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: active ? '1px solid #C9A876' : '1px solid var(--border)',
    background: active ? 'rgba(201,168,118,0.14)' : 'var(--surface2)',
    color: active ? '#C9A876' : 'var(--text-muted)',
    transition: 'all 0.1s',
  }
}
