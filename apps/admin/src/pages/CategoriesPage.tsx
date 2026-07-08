import { useState, useEffect } from 'react'
import { Tags, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronRight, X, Save, AlertCircle, History } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { useTranslation } from '../lib/i18n'
import { api } from '../lib/api'

interface GlobalCategory {
  id: string
  nameRu: string
  nameUz: string
  slug: string
  parentId: string | null
  parent: { id: string; nameRu: string } | null
  isActive: boolean
  sortOrder: number
  createdAt: string
}

const EMPTY_FORM = { nameRu: '', nameUz: '', slug: '', parentId: '', sortOrder: '0', isActive: true }

// FEAT-CATEGORY-JOURNAL-001: запись журнала (audit_log, entityType=GlobalCategory)
interface CategoryAuditLog {
  id: string
  actorUserId: string | null
  action: string
  entityId: string
  payload: Record<string, any>
  createdAt: string
}

// DUP-003: preview slugify должен быть синхронен с backend `SlugService.generate()`.
// Backend regex: latin-only, dash-separated, fallback на server-side. Если поле slug
// пустое — backend сгенерирует. Здесь даём UI preview ТОЛЬКО для латиницы — для
// кириллицы вернём пустую строку, чтобы пользователь видел что нужно вручную задать
// slug (старая реализация молча возвращала пустую строку для всех кириллических имён,
// но с `_` вместо `-` — slug не совпадал с тем, что в итоге создавал backend).
// Контракт: lower + spaces→'-' + strip non-[a-z0-9-] + collapse + trim + slice(80).
function slugify(s: string) {
  return s.trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export default function CategoriesPage() {
  const { t } = useTranslation()
  const { data, loading, error, refetch } = useFetch<GlobalCategory[]>('/api/v1/admin/categories')
  const [categories, setCategories] = useState<GlobalCategory[]>([])
  useEffect(() => { setCategories(data ?? []) }, [data])

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<GlobalCategory | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // FEAT-CATEGORY-JOURNAL-001: журнал изменений категорий (модал)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLogs, setHistoryLogs] = useState<CategoryAuditLog[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  async function openHistory() {
    setHistoryOpen(true)
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const res = await api.get<{ logs: CategoryAuditLog[] }>('/api/v1/admin/audit-log?entityType=GlobalCategory&limit=50')
      setHistoryLogs(res.logs ?? [])
    } catch (e: any) {
      setHistoryError(e.message ?? t('categories.historyLoadError'))
    } finally {
      setHistoryLoading(false)
    }
  }

  const roots = categories.filter(c => !c.parentId)
  const children = (parentId: string) => categories.filter(c => c.parentId === parentId)

  function openCreate(parentId?: string) {
    setForm({ ...EMPTY_FORM, parentId: parentId ?? '' })
    setEditTarget(null)
    setFormError('')
    setModal('create')
  }

  function openEdit(cat: GlobalCategory) {
    setForm({
      nameRu: cat.nameRu,
      nameUz: cat.nameUz,
      slug: cat.slug,
      parentId: cat.parentId ?? '',
      sortOrder: String(cat.sortOrder),
      isActive: cat.isActive,
    })
    setEditTarget(cat)
    setFormError('')
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditTarget(null)
    setFormError('')
  }

  function handleNameRuChange(val: string) {
    setForm(f => ({
      ...f,
      nameRu: val,
      slug: modal === 'create' ? slugify(val) : f.slug,
    }))
  }

  async function handleSave() {
    if (!form.nameRu.trim() || !form.nameUz.trim() || !form.slug.trim()) {
      setFormError(t('categories.errRequired'))
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const body = {
        nameRu: form.nameRu.trim(),
        nameUz: form.nameUz.trim(),
        slug: form.slug.trim(),
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      }
      if (modal === 'create') {
        await api.post('/api/v1/admin/categories', body)
      } else if (editTarget) {
        await api.patch(`/api/v1/admin/categories/${editTarget.id}`, body)
      }
      closeModal()
      refetch()
    } catch (e: any) {
      setFormError(e.message ?? t('categories.errSave'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(cat: GlobalCategory) {
    setActionError(null)
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
    try {
      await api.patch(`/api/v1/admin/categories/${cat.id}`, { isActive: !cat.isActive })
    } catch (e: any) {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: cat.isActive } : c))
      setActionError(e.message ?? t('common.error'))
    }
  }

  async function handleDelete(id: string) {
    setActionError(null)
    setCategories(prev => prev.filter(c => c.id !== id))
    setConfirmDelete(null)
    try {
      await api.delete(`/api/v1/admin/categories/${id}`)
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? t('categories.errDelete'))
      refetch()
    }
  }

  const rootCategories = categories.filter(c => !c.parentId)

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Tags size={20} style={{ color: 'var(--text-muted)' }} />
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {t('categories.title')}
          </h1>
          <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
            {categories.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <History size={14} />
            {t('categories.history')}
          </button>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}
          >
            <Plus size={14} />
            {t('categories.add')}
          </button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-4 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>
          <AlertCircle size={14} />
          {actionError}
        </div>
      )}

      {loading && (
        <div className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</div>
      )}
      {error && (
        <div className="text-sm py-8 text-center" style={{ color: '#f87171' }}>{error}</div>
      )}

      {!loading && !error && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {rootCategories.length === 0 && (
            <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('categories.empty')}
            </div>
          )}

          {rootCategories.map((root, ri) => (
            <div key={root.id}>
              {/* Root row */}
              <CategoryRow
                cat={root}
                depth={0}
                isLast={ri === rootCategories.length - 1 && children(root.id).length === 0}
                onEdit={openEdit}
                onToggle={toggleActive}
                onDelete={setConfirmDelete}
                onAddChild={() => openCreate(root.id)}
              />

              {/* Children */}
              {children(root.id).map((child, ci) => {
                const grandchildren = children(child.id)
                return (
                  <div key={child.id}>
                    <CategoryRow
                      cat={child}
                      depth={1}
                      isLast={ci === children(root.id).length - 1 && grandchildren.length === 0}
                      onEdit={openEdit}
                      onToggle={toggleActive}
                      onDelete={setConfirmDelete}
                      onAddChild={() => openCreate(child.id)}
                    />
                    {grandchildren.map((grand, gi) => (
                      <CategoryRow
                        key={grand.id}
                        cat={grand}
                        depth={2}
                        isLast={gi === grandchildren.length - 1}
                        onEdit={openEdit}
                        onToggle={toggleActive}
                        onDelete={setConfirmDelete}
                        onAddChild={undefined}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="rounded-xl p-6 w-80 shadow-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>{t('categories.deleteConfirmTitle')}</h3>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              {t('categories.deleteConfirmText')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-md text-sm font-medium"
                style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 rounded-md text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="rounded-xl w-[480px] shadow-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {modal === 'create' ? t('categories.modalCreate') : t('categories.modalEdit')}
              </h3>
              <button onClick={closeModal} aria-label={t('common.close')}><X size={16} style={{ color: 'var(--text-muted)' }} /></button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-3">
              <Field label={t('categories.fieldNameRu')} value={form.nameRu} onChange={handleNameRuChange} placeholder="Электроника" />
              <Field label={t('categories.fieldNameUz')} value={form.nameUz} onChange={v => setForm(f => ({ ...f, nameUz: v }))} placeholder="Elektronika" />
              <Field
                label={t('categories.fieldSlug')}
                value={form.slug}
                onChange={v => setForm(f => ({ ...f, slug: v }))}
                placeholder="electronics"
                hint={t('categories.slugHint')}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('categories.parent')}</label>
                  <select
                    value={form.parentId}
                    onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md text-sm"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    <option value="">{t('categories.rootOption')}</option>
                    {categories
                      .filter(c => editTarget ? c.id !== editTarget.id : true)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.parentId ? `  ↳ ${c.nameRu}` : c.nameRu}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-24">
                  <Field
                    label={t('categories.sortOrder')}
                    value={form.sortOrder}
                    onChange={v => setForm(f => ({ ...f, sortOrder: v }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('categories.activeLabel')}</span>
              </label>

              {formError && (
                <p className="text-xs" style={{ color: '#f87171' }}>{formError}</p>
              )}
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={closeModal}
                className="flex-1 py-2 rounded-md text-sm font-medium"
                style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}
              >
                <Save size={13} />
                {saving ? t('categories.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEAT-CATEGORY-JOURNAL-001: журнал изменений категорий */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="rounded-xl w-[560px] max-h-[80vh] flex flex-col shadow-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <History size={16} style={{ color: 'var(--text-muted)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('categories.historyTitle')}</h3>
              </div>
              <button onClick={() => setHistoryOpen(false)} aria-label={t('common.close')}><X size={16} style={{ color: 'var(--text-muted)' }} /></button>
            </div>

            <div className="overflow-y-auto px-5 py-3 flex flex-col gap-2">
              {historyLoading && (
                <div className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</div>
              )}
              {!historyLoading && historyError && (
                <div className="text-sm py-8 text-center" style={{ color: '#f87171' }}>{historyError}</div>
              )}
              {!historyLoading && !historyError && historyLogs.length === 0 && (
                <div className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>{t('categories.historyEmpty')}</div>
              )}
              {!historyLoading && !historyError && historyLogs.map(log => (
                <HistoryEntry key={log.id} log={log} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// FEAT-CATEGORY-JOURNAL-001: одна запись журнала категорий
function HistoryEntry({ log }: { log: CategoryAuditLog }) {
  const { t } = useTranslation()
  const meta: Record<string, { label: string; color: string }> = {
    CATEGORY_CREATED: { label: t('categories.histCreated'), color: '#10B981' },
    CATEGORY_UPDATED: { label: t('categories.histUpdated'), color: '#818cf8' },
    CATEGORY_DELETED: { label: t('categories.histDeleted'), color: '#f87171' },
    CATEGORY_SEEDED:  { label: t('categories.histSeeded'),  color: '#eab308' },
  }
  const m = meta[log.action] ?? { label: log.action, color: 'var(--text-muted)' }
  const p = log.payload ?? {}

  let summary = ''
  if (log.action === 'CATEGORY_UPDATED' && p.before && p.after) {
    summary = Object.keys(p.after)
      .map(k => `${k}: ${JSON.stringify(p.before[k])} → ${JSON.stringify(p.after[k])}`)
      .join(', ')
  } else if (log.action === 'CATEGORY_SEEDED') {
    summary = `${p.categoriesUpserted ?? '?'} кат. / ${p.filtersUpserted ?? '?'} фильтров`
  } else {
    summary = [p.nameRu, p.slug ? `(${p.slug})` : ''].filter(Boolean).join(' ')
  }

  const when = new Date(log.createdAt).toLocaleString('ru', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex items-start gap-3 py-2 text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface2)', color: m.color, border: `1px solid ${m.color}33` }}>
        {m.label}
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate" style={{ color: 'var(--text)' }}>{summary || '—'}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
          {when}{log.actorUserId ? ` · ${log.actorUserId.slice(0, 8)}` : ''}
        </p>
      </div>
    </div>
  )
}

interface RowProps {
  cat: GlobalCategory
  depth: number
  isLast: boolean
  onEdit: (cat: GlobalCategory) => void
  onToggle: (cat: GlobalCategory) => void
  onDelete: (id: string) => void
  onAddChild?: () => void
}

function CategoryRow({ cat, depth, onEdit, onToggle, onDelete, onAddChild }: RowProps) {
  const { t } = useTranslation()
  const indent = depth * 24

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm"
      style={{ borderBottom: '1px solid var(--border)', background: depth > 0 ? 'var(--surface2)' : undefined }}
    >
      <div style={{ width: indent, flexShrink: 0 }} />

      {depth > 0 && <ChevronRight size={12} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />}

      {/* Active dot */}
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: cat.isActive ? '#10B981' : '#6B7280' }}
      />

      {/* Names */}
      <div className="flex-1 min-w-0">
        <span className="font-medium" style={{ color: 'var(--text)' }}>{cat.nameRu}</span>
        <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{cat.nameUz}</span>
      </div>

      {/* Slug */}
      <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface2)', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
        {cat.slug}
      </code>

      {/* Sort */}
      <span className="text-xs w-6 text-center tabular-nums" style={{ color: 'var(--text-dim)' }}>{cat.sortOrder}</span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {onAddChild && (
          <ActionBtn onClick={onAddChild} title={t('categories.addSubcategory')}>
            <Plus size={13} />
          </ActionBtn>
        )}
        <ActionBtn onClick={() => onEdit(cat)} title={t('categories.editAction')}>
          <Pencil size={13} />
        </ActionBtn>
        <ActionBtn onClick={() => onToggle(cat)} title={cat.isActive ? t('categories.deactivate') : t('categories.activate')}>
          {cat.isActive
            ? <ToggleRight size={14} style={{ color: '#10B981' }} />
            : <ToggleLeft size={14} style={{ color: '#6B7280' }} />
          }
        </ActionBtn>
        <ActionBtn onClick={() => onDelete(cat.id)} title={t('common.delete')} danger>
          <Trash2 size={13} />
        </ActionBtn>
      </div>
    </div>
  )
}

function ActionBtn({ onClick, title, danger, children }: {
  onClick: () => void; title: string; danger?: boolean; children: React.ReactNode
}) {
  // DESIGN-A11Y-ARIA-LABELS-001: aria-label = title (title не озвучивается
  // скринридерами как accessible name). Icon-only кнопка — children это
  // декоративная SVG, поэтому accessible name держим на button.
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
      style={{ color: danger ? 'var(--error)' : 'var(--text-dim)', opacity: danger ? 0.7 : 1 }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'var(--surface-error)' : 'var(--surface2)'
        e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--text)'
        e.currentTarget.style.opacity = '1'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = ''
        e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--text-dim)'
        e.currentTarget.style.opacity = danger ? '0.7' : '1'
      }}
    >
      {children}
    </button>
  )
}

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md text-sm outline-none"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
      {hint && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{hint}</p>}
    </div>
  )
}
