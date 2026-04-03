import { useState, useEffect } from 'react'
import { Database, Search, Edit2, Trash2, Plus, ChevronLeft, ChevronRight, X, Check, AlertTriangle, RefreshCw, Lock } from 'lucide-react'
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

function EditModal({
  row,
  writableFields,
  onSave,
  onCancel,
}: {
  row: Record<string, unknown>
  writableFields: string[]
  onSave: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    writableFields.forEach(f => { init[f] = String(row[f] ?? '') })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setErr(null)
    try {
      await onSave(values)
    } catch (e: any) {
      setErr(e.message ?? 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Редактировать запись</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* ID (readonly) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>id</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            {String(row.id ?? '—')}
          </div>
        </div>

        {writableFields.map(field => (
          <div key={field} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{field}</div>
            <input
              value={values[field]}
              onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
          </div>
        ))}

        {err && (
          <div style={{ fontSize: 12, color: '#EF4444', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, marginBottom: 14 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>
            Отмена
          </button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}>
            <Check size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InsertModal({
  writableFields,
  onSave,
  onCancel,
}: {
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
    setSaving(true)
    setErr(null)
    try {
      await onSave(values)
    } catch (e: any) {
      setErr(e.message ?? 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Добавить запись</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {writableFields.map(field => (
          <div key={field} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{field}</div>
            <input
              value={values[field]}
              onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
          </div>
        ))}

        {err && (
          <div style={{ fontSize: 12, color: '#EF4444', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, marginBottom: 14 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>
            Отмена
          </button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}>
            <Plus size={14} /> {saving ? 'Сохранение...' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DatabasePage() {
  const [activeTable, setActiveTable] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showInsert, setShowInsert] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [tableVersion, setTableVersion] = useState(0)

  const { data: tablesData, loading: tablesLoading } = useFetch<TableMeta[]>('/api/v1/admin/db/tables', [])

  const tableParams = new URLSearchParams({ page: String(page), limit: '25' })
  if (search) tableParams.set('search', search)

  const { data: rowsData, loading: rowsLoading, refetch: refetchRows } = useFetch<TableData>(
    activeTable ? `/api/v1/admin/db/tables/${activeTable}?${tableParams}` : '',
    [activeTable, page, search, tableVersion],
  )

  // Reset page when table or search changes
  useEffect(() => { setPage(1) }, [activeTable, search])

  const handleSearch = () => setSearch(searchInput.trim())
  const handleClearSearch = () => { setSearch(''); setSearchInput('') }

  const handleSaveEdit = async (data: Record<string, unknown>) => {
    if (!editRow || !activeTable) return
    await api.patch(`/api/v1/admin/db/tables/${activeTable}/${editRow.id}`, data)
    setEditRow(null)
    setTableVersion(v => v + 1)
  }

  const handleDelete = async (id: string) => {
    if (!activeTable) return
    setActionError(null)
    try {
      await api.delete(`/api/v1/admin/db/tables/${activeTable}/${id}`)
      setDeleteConfirm(null)
      setTableVersion(v => v + 1)
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка удаления')
      setDeleteConfirm(null)
    }
  }

  const handleInsert = async (data: Record<string, unknown>) => {
    if (!activeTable) return
    await api.post(`/api/v1/admin/db/tables/${activeTable}`, data)
    setShowInsert(false)
    setTableVersion(v => v + 1)
  }

  const rows = rowsData?.rows ?? []
  const allColumns = rows.length > 0 ? Object.keys(rows[0]) : []
  // Show important columns first, limit to reasonable count
  const priorityCols = ['id', 'name', 'phone', 'slug', 'status', 'role', 'action', 'caseType', 'message', 'createdAt']
  const displayCols = [
    ...priorityCols.filter(c => allColumns.includes(c)),
    ...allColumns.filter(c => !priorityCols.includes(c)),
  ].slice(0, 8)

  const currentTableMeta = tablesData?.find(t => t.table === activeTable)
  const writableFields = currentTableMeta?.writableFields ?? []
  const isReadonly = currentTableMeta?.readonly ?? true

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar — table list */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} color="var(--primary)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>База данных</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Только разрешённые таблицы</div>
        </div>

        <div style={{ padding: '8px 8px', flex: 1 }}>
          {tablesLoading && (
            <div style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-dim)' }}>Загрузка...</div>
          )}
          {tablesData?.map(t => (
            <button
              key={t.table}
              onClick={() => { setActiveTable(t.table); setSearch(''); setSearchInput('') }}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8, border: 'none',
                background: activeTable === t.table ? 'rgba(99,102,241,0.12)' : 'none',
                color: activeTable === t.table ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 2,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {t.readonly && <Lock size={10} style={{ opacity: 0.5 }} />}
                {t.table}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.6 }}>{t.count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeTable ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <Database size={40} color="var(--text-dim)" />
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Выберите таблицу слева</div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{activeTable}</span>
                {isReadonly && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(148,163,184,0.1)', color: '#94A3B8', fontWeight: 600 }}>
                    <Lock size={9} style={{ display: 'inline', marginRight: 3 }} />только чтение
                  </span>
                )}
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {rowsData?.total ?? 0} записей
                </span>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Поиск..."
                  style={{ paddingLeft: 28, paddingRight: 10, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 12, outline: 'none', width: 180 }}
                />
              </div>
              <button onClick={handleSearch} style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Найти
              </button>
              {search && (
                <button onClick={handleClearSearch} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                  <X size={13} />
                </button>
              )}

              <button onClick={() => setTableVersion(v => v + 1)} style={{ height: 32, width: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={13} />
              </button>

              {!isReadonly && writableFields.length > 0 && (
                <button onClick={() => setShowInsert(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={13} /> Добавить
                </button>
              )}
            </div>

            {actionError && (
              <div style={{ margin: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
                <AlertTriangle size={14} /> {actionError}
              </div>
            )}

            {/* Table */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {rowsLoading ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Загрузка...</div>
              ) : rows.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Нет данных</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {displayCols.map(col => (
                        <th key={col} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                          {col}
                        </th>
                      ))}
                      {!isReadonly && <th style={{ padding: '10px 14px', width: 80 }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={String(row.id ?? i)}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        {displayCols.map(col => {
                          const val = row[col]
                          const display = val === null || val === undefined ? '—'
                            : typeof val === 'boolean' ? (val ? '✓' : '✗')
                            : typeof val === 'object' ? JSON.stringify(val).slice(0, 60)
                            : String(val).slice(0, 80)
                          return (
                            <td key={col} style={{ padding: '10px 14px', color: 'var(--text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {col === 'id'
                                ? <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-dim)' }}>{display.slice(0, 8)}…</span>
                                : col === 'createdAt' || col === 'updatedAt'
                                  ? <span style={{ color: 'var(--text-muted)' }}>{new Date(String(val)).toLocaleDateString('ru-RU')}</span>
                                  : display
                              }
                            </td>
                          )
                        })}
                        {!isReadonly && (
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {writableFields.length > 0 && (
                                <button
                                  onClick={() => setEditRow(row)}
                                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  title="Редактировать"
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteConfirm(String(row.id))}
                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Удалить"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {rowsData && rowsData.totalPages > 1 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Стр. {rowsData.page} из {rowsData.totalPages} · {rowsData.total} записей
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: page === 1 ? 'var(--text-dim)' : 'var(--text-muted)', fontSize: 12, cursor: page === 1 ? 'default' : 'pointer' }}
                  >
                    <ChevronLeft size={13} /> Назад
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(rowsData.totalPages, p + 1))}
                    disabled={page === rowsData.totalPages}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: page === rowsData.totalPages ? 'var(--text-dim)' : 'var(--text-muted)', fontSize: 12, cursor: page === rowsData.totalPages ? 'default' : 'pointer' }}
                  >
                    Вперёд <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editRow && rowsData && (
        <EditModal
          row={editRow}
          writableFields={writableFields}
          onSave={handleSaveEdit}
          onCancel={() => setEditRow(null)}
        />
      )}

      {/* Insert Modal */}
      {showInsert && (
        <InsertModal
          writableFields={writableFields}
          onSave={handleInsert}
          onCancel={() => setShowInsert(false)}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 380 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={20} color="#EF4444" />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Удалить запись?</h3>
            </div>
            <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 13 }}>
              ID: <code style={{ fontFamily: 'monospace', fontSize: 12 }}>{deleteConfirm}</code>
              <br />Это действие необратимо.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>
                Отмена
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#EF4444', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
