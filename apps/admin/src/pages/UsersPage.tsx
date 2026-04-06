import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Phone, Search, ChevronLeft, ChevronRight, MessageCircle, UserCheck, X } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'

interface UserRow {
  id: string
  phone: string
  role: 'BUYER' | 'SELLER' | 'ADMIN'
  status: 'ACTIVE' | 'BLOCKED'
  isPhoneVerified: boolean
  languageCode: string | null
  createdAt: string
  seller: { telegramChatId: string | null } | null
}

const ROLE_CFG: Record<string, { bg: string; text: string; label: string }> = {
  SELLER: { bg: 'rgba(99,102,241,0.12)',  text: '#818CF8', label: 'Продавец' },
  BUYER:  { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', label: 'Покупатель' },
  ADMIN:  { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', label: 'Админ' },
}

const STATUS_CFG: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE:  { bg: 'rgba(16,185,129,0.10)', text: '#10B981', label: 'Активен' },
  BLOCKED: { bg: 'rgba(239,68,68,0.10)',  text: '#EF4444', label: 'Заблокирован' },
}

export default function UsersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const params = new URLSearchParams({ page: String(page), limit: '30' })
  if (role)   params.set('role', role)
  if (status) params.set('status', status)

  const { data, loading } = useFetch<{ users: UserRow[]; total: number }>(
    `/api/v1/admin/users?${params}`,
    [page, role, status],
  )

  const users = data?.users ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 30)

  const filtered = search
    ? users.filter(u => u.phone.includes(search))
    : users

  const handleSearch = () => setSearch(searchInput.trim())
  const handleClearSearch = () => { setSearch(''); setSearchInput('') }

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={20} color="var(--primary)" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Пользователи</h1>
          {total > 0 && (
            <span style={{ padding: '2px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: '#818CF8', fontSize: 12, fontWeight: 700 }}>
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
              placeholder="Поиск по телефону..."
              style={{ paddingLeft: 32, paddingRight: 12, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none', width: 220 }}
            />
          </div>
          <button onClick={handleSearch} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Найти
          </button>
          {search && (
            <button onClick={handleClearSearch} style={{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
              Сбросить
            </button>
          )}
        </div>

        {/* Role filter */}
        {(['', 'SELLER', 'BUYER', 'ADMIN'] as const).map(r => (
          <button
            key={r}
            onClick={() => { setRole(r); setPage(1) }}
            style={{
              height: 34, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: role === r ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: role === r ? 'var(--primary)' : 'var(--surface2)',
              color: role === r ? 'white' : 'var(--text-muted)',
            }}
          >
            {r || 'Все роли'}
          </button>
        ))}

        {/* Status filter */}
        {(['', 'ACTIVE', 'BLOCKED'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            style={{
              height: 34, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: status === s ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: status === s ? 'var(--primary)' : 'var(--surface2)',
              color: status === s ? 'white' : 'var(--text-muted)',
            }}
          >
            {s === '' ? 'Все статусы' : s === 'ACTIVE' ? 'Активные' : 'Заблокированные'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Телефон', 'Роль', 'Статус', 'Telegram', 'Дата регистрации', ''].map(col => (
                <th key={col} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Загрузка...</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Пользователи не найдены</td>
              </tr>
            )}
            {filtered.map((user, i) => {
              const roleCfg   = ROLE_CFG[user.role]   ?? ROLE_CFG.BUYER
              const statusCfg = STATUS_CFG[user.status] ?? STATUS_CFG.ACTIVE
              return (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: user.role === 'SELLER' ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (user.role === 'SELLER') (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                  onClick={() => {
                    if (user.role === 'SELLER') navigate(`/sellers?userId=${user.id}`)
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={13} color="var(--text-muted)" />
                      <span style={{ fontFamily: 'monospace', color: 'var(--text)', fontSize: 13 }}>{user.phone}</span>
                      {!user.isPhoneVerified && (
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontWeight: 600 }}>не верифицирован</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: roleCfg.bg, color: roleCfg.text }}>
                      {roleCfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: statusCfg.bg, color: statusCfg.text }}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {user.seller?.telegramChatId ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MessageCircle size={13} color="#10B981" />
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{user.seller.telegramChatId}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {user.role === 'SELLER' && (
                      <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>→ Профиль</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Стр. {page} из {totalPages} · {total} записей
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: page === 1 ? 'var(--text-dim)' : 'var(--text-muted)', fontSize: 13, cursor: page === 1 ? 'default' : 'pointer' }}
            >
              <ChevronLeft size={14} /> Назад
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: page === totalPages ? 'var(--text-dim)' : 'var(--text-muted)', fontSize: 13, cursor: page === totalPages ? 'default' : 'pointer' }}
            >
              Вперёд <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
