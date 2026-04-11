import { useState, useEffect } from 'react'
import { Database, Search, Edit2, Trash2, Plus, ChevronLeft, ChevronRight, X, Check, AlertTriangle, RefreshCw, Lock, Eye, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'

interface TableMeta {
  table: string
  count: number
  readonly: boolean
  writableFields: string[]
}

interface TableData {
  table: string
  rows: Record<string, unknown>[]
  total: number
  page: number
  totalPages: number
  writableFields: string[]
  readonly: boolean
}

// ── Value rendering ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE:       { bg: 'rgba(16,185,129,0.12)',  color: '#10B981' },
  PUBLISHED:    { bg: 'rgba(16,185,129,0.12)',  color: '#10B981' },
  APPROVED:     { bg: 'rgba(16,185,129,0.12)',  color: '#10B981' },
  VERIFIED:     { bg: 'rgba(16,185,129,0.12)',  color: '#10B981' },
  COMPLETED:    { bg: 'rgba(16,185,129,0.12)',  color: '#10B981' },
  PAID:         { bg: 'rgba(16,185,129,0.12)',  color: '#10B981' },
  BLOCKED:      { bg: 'rgba(239,68,68,0.1)',    color: '#EF4444' },
  REJECTED:     { bg: 'rgba(239,68,68,0.1)',    color: '#EF4444' },
  CANCELLED:    { bg: 'rgba(239,68,68,0.1)',    color: '#EF4444' },
  SUSPENDED:    { bg: 'rgba(239,68,68,0.1)',    color: '#EF4444' },
  PENDING:      { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B' },
  UNDER_REVIEW: { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B' },
  DRAFT:        { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
  UNVERIFIED:   { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
  UNPAID:       { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
  SELLER:       { bg: 'rgba(99,102,241,0.12)',  color: '#818CF8' },
  BUYER:        { bg: 'rgba(99,102,241,0.12)',  color: '#818CF8' },
  ADMIN:        { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B' },
}

function isDateCol(col: string, val: unknown): boolean {
  if (typeof val !== 'string') return false
  if (!col.endsWith('At') && col !== 'createdAt' && col !== 'updatedAt' && col !== 'deletedAt' && col !== 'publishedAt') return false
  return !isNaN(Date.parse(val as string))
}

function fmtDate(val: string) {
  try {
    return new Date(val).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return val }
}

function CellValue({ col, val }: { col: string; val: unknown }) {
  if (val === null || val === undefined) return <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>
  if (typeof val === 'boolean') return (
    <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600,
      background: val ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
      color: val ? '#10B981' : '#EF4444' }}>
      {val ? 'true' : 'false'}
    </span>
  )
  if (typeof val === 'string' && STATUS_COLORS[val]) {
    const s = STATUS_COLORS[val]
    return <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{val}</span>
  }
  if (isDateCol(col, val)) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{fmtDate(val as string)}</span>
  if ((col === 'id' || col.endsWith('Id')) && typeof val === 'string' && val.length > 12)
    return <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-dim)' }} title={val}>{val.slice(0, 8)}…</span>
  if (typeof val === 'object') {
    const s = JSON.stringify(val)
    return <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }} title={s}>{s.slice(0, 40)}{s.length > 40 ? '…' : ''}</span>
  }
  const s = String(val)
  return <span title={s.length > 50 ? s : undefined}>{s.slice(0, 50)}{s.length > 50 ? '…' : ''}</span>
}

function DetailValue({ col, val }: { col: string; val: unknown }) {
  const [expanded, setExpanded] = useState(false)
  if (val === null || val === undefined) return <span style={{ color: 'var(--text-dim)' }}>null</span>
  if (typeof val === 'boolean') return (
    <span style={{ padding: '2px 9px', borderRadius: 10, fontSize: 12, fontWeight: 600,
      background: val ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
      color: val ? '#10B981' : '#EF4444' }}>
      {val ? 'true' : 'false'}
    </span>
  )
  if (typeof val === 'string' && STATUS_COLORS[val]) {
    const s = STATUS_COLORS[val]
    return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{val}</span>
  }
  if (isDateCol(col, val)) return (
    <span style={{ fontSize: 13, color: 'var(--text)' }}>
      {fmtDate(val as string)}
      <span style={{ color: 'var(--text-dim)', fontSize: 11, marginLeft: 6 }}>{val as string}</span>
    </span>
  )
  if (typeof val === 'object') {
    const s = JSON.stringify(val, null, 2)
    return (
      <div>
        <pre style={{ margin: 0, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 6,
          fontSize: 11, color: 'var(--text-muted)', maxHeight: expanded ? 400 : 80,
          overflow: 'auto', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {s}
        </pre>
        {s.length > 100 && (
          <button onClick={() => setExpanded(x => !x)}
            style={{ marginTop: 4, fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            {expanded ? 'Свернуть' : 'Развернуть'}
          </button>
        )}
      </div>
    )
  }
  const s = String(val)
  return (
    <span style={{ fontSize: 13, color: 'var(--text)', wordBreak: 'break-all',
      fontFamily: (col === 'id' || col.endsWith('Id')) ? 'monospace' : 'inherit' }}>
      {s}
    </span>
  )
}

// ── Row Detail Panel ──────────────────────────────────────────────────────────

function RowDetailPanel({ row, writableFields, isReadonly, onEdit, onDelete, onClose }: {
  row: Record<string, unknown>
  writableFields: string[]
  isReadonly: boolean
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  return (
    <div style={{ width: 340, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Eye size={14} color="var(--primary)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Запись</span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {!isReadonly && writableFields.length > 0 && (
            <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', borderRadius: 6, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Edit2 size={11} /> Изменить
            </button>
          )}
          {!isReadonly && (
            <button onClick={onDelete} style={{ height: 28, width: 28, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={12} />
            </button>
          )}
          <button onClick={onClose} style={{ height: 28, width: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {Object.entries(row).map(([key, val]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              {key}
              {writableFields.includes(key) && <span style={{ color: 'var(--primary)', fontSize: 10 }}>✎</span>}
            </div>
            <DetailValue col={key} val={val} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ row, writableFields, onSave, onCancel }: {
  row: Record<string, unknown>
  writableFields: string[]
  onSave: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    writableFields.forEach(f => { init[f] = row[f] != null ? String(row[f]) : '' })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true); setErr(null)
    try { await onSave(values) }
    catch (e: any) { setErr(e.message ?? 'Ошибка') }
    finally { setSaving(false) }
  }

  const isBool = (field: string) => {
    const v = row[field]
    return typeof v === 'boolean' || values[field] === 'true' || values[field] === 'false'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Редактировать</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>id</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', wordBreak: 'break-all' }}>
            {String(row.id ?? '—')}
          </div>
        </div>

        {writableFields.map(field => (
          <div key={field} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{field}</div>
            {isBool(field) ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {['true', 'false'].map(opt => (
                  <button key={opt} onClick={() => setValues(v => ({ ...v, [field]: opt }))}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8,
                      border: `1px solid ${values[field] === opt ? (opt === 'true' ? '#10B981' : '#EF4444') : 'var(--border)'}`,
                      background: values[field] === opt ? (opt === 'true' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)') : 'var(--surface2)',
                      color: values[field] === opt ? (opt === 'true' ? '#10B981' : '#EF4444') : 'var(--text-muted)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input value={values[field]} onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
            )}
          </div>
        ))}

        {err && <div style={{ fontSize: 12, color: '#EF4444', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>Отмена</button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}>
            <Check size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Insert Modal ──────────────────────────────────────────────────────────────

function InsertModal({ writableFields, onSave, onCancel }: {
  writableFields: string[]
  onSave: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    writableFields.forEach(f => { init[f] = '' })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true); setErr(null)
    try { await onSave(values) }
    catch (e: any) { setErr(e.message ?? 'Ошибка') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Добавить запись</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        {writableFields.map(field => (
          <div key={field} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{field}</div>
            <input value={values[field]} onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
          </div>
        ))}
        {err && <div style={{ fontSize: 12, color: '#EF4444', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>Отмена</button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}>
            <Plus size={14} /> {saving ? 'Сохранение...' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DatabasePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTable, setActiveTable] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null)
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showInsert, setShowInsert] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [tableVersion, setTableVersion] = useState(0)

  const { data: tablesData, loading: tablesLoading, error: tablesError, refetch: refetchTables } = useFetch<TableMeta[]>('/api/v1/admin/db/tables', [])

  const tableParams = new URLSearchParams({ page: String(page), limit: '25' })
  if (search) tableParams.set('search', search)

  const { data: rowsData, loading: rowsLoading } = useFetch<TableData>(
    activeTable ? `/api/v1/admin/db/tables/${activeTable}?${tableParams}` : null,
    [activeTable, page, search, tableVersion],
  )

  useEffect(() => { setPage(1); setSelectedRow(null) }, [activeTable, search])

  const handleSaveEdit = async (data: Record<string, unknown>) => {
    if (!editRow || !activeTable) return
    setActionError(null)
    try {
      await api.patch(`/api/v1/admin/db/tables/${activeTable}/${editRow.id}`, data)
      setEditRow(null)
      setSelectedRow(prev => prev ? { ...prev, ...data } : null)
      setTableVersion(v => v + 1)
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка сохранения')
    }
  }

  const handleDelete = async (id: string) => {
    if (!activeTable) return
    setActionError(null)
    try {
      await api.delete(`/api/v1/admin/db/tables/${activeTable}/${id}`)
      setDeleteConfirmId(null)
      setSelectedRow(null)
      setTableVersion(v => v + 1)
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка удаления')
      setDeleteConfirmId(null)
    }
  }

  const handleInsert = async (data: Record<string, unknown>) => {
    if (!activeTable) return
    setActionError(null)
    try {
      await api.post(`/api/v1/admin/db/tables/${activeTable}`, data)
      setShowInsert(false)
      setTableVersion(v => v + 1)
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка создания записи')
    }
  }

  const rows = rowsData?.rows ?? []
  const allColumns = rows.length > 0 ? Object.keys(rows[0]) : []
  const priorityCols = ['id', 'phone', 'name', 'title', 'slug', 'status', 'role', 'verificationStatus', 'action', 'entityType', 'caseType', 'orderNumber', 'message', 'createdAt']
  const displayCols = [
    ...priorityCols.filter(c => allColumns.includes(c)),
    ...allColumns.filter(c => !priorityCols.includes(c)),
  ]

  const currentTableMeta = tablesData?.find(t => t.table === activeTable)
  const writableFields = currentTableMeta?.writableFields ?? []
  const isReadonly = currentTableMeta?.readonly ?? true

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 220 : 0, flexShrink: 0, borderRight: sidebarOpen ? '1px solid var(--border)' : 'none', background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', transition: 'width 0.2s ease' }}>
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={15} color="var(--primary)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>База данных</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>10 таблиц · whitelist</div>
          </div>
        </div>

        <div style={{ padding: '8px', flex: 1 }}>
          {tablesLoading && <div style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-dim)' }}>Загрузка...</div>}
          {tablesError && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: '#EF4444', background: 'rgba(239,68,68,0.08)', borderRadius: 8, margin: '4px 0' }}>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>API недоступен</div>
              <div style={{ wordBreak: 'break-word', marginBottom: 8, color: 'var(--text-muted)', fontSize: 11 }}>
                {tablesError.includes('fetch') ? 'Запустите: pnpm dev:api' : tablesError}
              </div>
              <button onClick={refetchTables} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 26, padding: '0 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <RefreshCw size={10} /> Повторить
              </button>
            </div>
          )}
          {!tablesLoading && !tablesError && !tablesData?.length && (
            <div style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-dim)' }}>Таблицы не найдены</div>
          )}
          {tablesData?.map(t => (
            <button key={t.table}
              onClick={() => { setActiveTable(t.table); setSearch(''); setSearchInput('') }}
              style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8, border: 'none',
                background: activeTable === t.table ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: activeTable === t.table ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                {t.readonly && <Lock size={10} style={{ opacity: 0.5, flexShrink: 0 }} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.table}</span>
              </span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.6, flexShrink: 0, marginLeft: 4 }}>{t.count.toLocaleString()}</span>
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {!activeTable ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <Database size={44} color="var(--text-dim)" />
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Выберите таблицу слева</div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
              <button onClick={() => setSidebarOpen(o => !o)} title={sidebarOpen ? 'Скрыть таблицы' : 'Показать таблицы'}
                style={{ height: 32, width: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{activeTable}</span>
              {isReadonly && (
                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: 'rgba(148,163,184,0.1)', color: '#94A3B8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Lock size={9} />только чтение
                </span>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{rowsData?.total ?? 0} записей</span>
              <div style={{ flex: 1 }} />
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearch(searchInput.trim())}
                  placeholder="Поиск..." style={{ paddingLeft: 28, paddingRight: 10, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 12, outline: 'none', width: 160 }} />
              </div>
              <button onClick={() => setSearch(searchInput.trim())} style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Найти</button>
              {search && (
                <button onClick={() => { setSearch(''); setSearchInput('') }} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={13} />
                </button>
              )}
              <button onClick={() => setTableVersion(v => v + 1)} title="Обновить"
                style={{ height: 32, width: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={13} />
              </button>
              {!isReadonly && writableFields.length > 0 && (
                <button onClick={() => setShowInsert(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={13} /> Добавить
                </button>
              )}
            </div>

            {actionError && (
              <div style={{ margin: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, flexShrink: 0 }}>
                <AlertTriangle size={13} /> {actionError}
                <button onClick={() => setActionError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><X size={13} /></button>
              </div>
            )}

            {/* Table */}
            <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
              {rowsLoading ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Загрузка...</div>
              ) : rows.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  {search ? `Ничего не найдено по «${search}»` : 'Таблица пуста'}
                </div>
              ) : (
                <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {displayCols.map(col => (
                        <th key={col} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                          {col}{writableFields.includes(col) ? <span style={{ color: 'var(--primary)', marginLeft: 2 }}>✎</span> : null}
                        </th>
                      ))}
                      <th style={{ padding: '9px 14px', width: 80 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const isSel = selectedRow?.id != null && selectedRow.id === row.id
                      return (
                        <tr key={String(row.id ?? i)}
                          onClick={() => setSelectedRow(isSel ? null : row)}
                          style={{ borderBottom: '1px solid var(--border)', background: isSel ? 'rgba(99,102,241,0.07)' : undefined, cursor: 'pointer' }}
                          onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--surface2)' }}
                          onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = '' }}>
                          {displayCols.map(col => (
                            <td key={col} style={{ padding: '9px 14px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <CellValue col={col} val={row[col]} />
                            </td>
                          ))}
                          <td style={{ padding: '9px 14px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button onClick={() => setSelectedRow(isSel ? null : row)} title="Подробнее"
                                style={{ padding: '3px 7px', borderRadius: 6, border: `1px solid ${isSel ? 'var(--primary)' : 'var(--border)'}`, background: isSel ? 'rgba(99,102,241,0.1)' : 'var(--surface)', color: isSel ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Eye size={12} />
                              </button>
                              {!isReadonly && writableFields.length > 0 && (
                                <button onClick={() => { setSelectedRow(row); setEditRow(row) }} title="Редактировать"
                                  style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <Edit2 size={12} />
                                </button>
                              )}
                              {!isReadonly && (
                                <button onClick={() => setDeleteConfirmId(String(row.id))} title="Удалить"
                                  style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {rowsData && rowsData.totalPages > 1 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Стр. {rowsData.page} из {rowsData.totalPages} · {rowsData.total} записей</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: page === 1 ? 'var(--text-dim)' : 'var(--text-muted)', fontSize: 12, cursor: page === 1 ? 'default' : 'pointer' }}>
                    <ChevronLeft size={13} /> Назад
                  </button>
                  <button onClick={() => setPage(p => Math.min(rowsData.totalPages, p + 1))} disabled={page === rowsData.totalPages}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: page === rowsData.totalPages ? 'var(--text-dim)' : 'var(--text-muted)', fontSize: 12, cursor: page === rowsData.totalPages ? 'default' : 'pointer' }}>
                    Вперёд <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Panel */}
      {selectedRow && (
        <RowDetailPanel
          row={selectedRow}
          writableFields={writableFields}
          isReadonly={isReadonly}
          onEdit={() => setEditRow(selectedRow)}
          onDelete={() => setDeleteConfirmId(String(selectedRow.id))}
          onClose={() => setSelectedRow(null)}
        />
      )}

      {/* Edit Modal */}
      {editRow && (
        <EditModal row={editRow} writableFields={writableFields} onSave={handleSaveEdit} onCancel={() => setEditRow(null)} />
      )}

      {/* Insert Modal */}
      {showInsert && (
        <InsertModal writableFields={writableFields} onSave={handleInsert} onCancel={() => setShowInsert(false)} />
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 380 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={20} color="#EF4444" />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Удалить запись?</h3>
            </div>
            <p style={{ margin: '0 0 6px', color: 'var(--text-muted)', fontSize: 13 }}>
              ID: <code style={{ fontFamily: 'monospace', fontSize: 11 }}>{deleteConfirmId.slice(0, 16)}…</code>
            </p>
            <p style={{ margin: '0 0 20px', color: '#EF4444', fontSize: 12 }}>Это действие необратимо.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>Отмена</button>
              <button onClick={() => handleDelete(deleteConfirmId)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#EF4444', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
