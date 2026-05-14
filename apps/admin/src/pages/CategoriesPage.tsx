import { useState, useEffect } from 'react'
import { Tags, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronRight, X, Save, AlertCircle } from 'lucide-react'
import { useFetch } from '../lib/hooks'
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

function slugify(s: string) {
  return s.trim().toLowerCase()
    .replace(/[а-яёa-z0-9]+/gi, (m) => m)
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 80)
}

export default function CategoriesPage() {
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
      setFormError('Заполните все обязательные поля')
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
      setFormError(e.message ?? 'Ошибка сохранения')
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
      setActionError(e.message ?? 'Ошибка')
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
      setActionError(e.message ?? 'Ошибка удаления')
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
            Глобальные категории
          </h1>
          <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
            {categories.length}
          </span>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          <Plus size={14} />
          Добавить
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-4 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>
          <AlertCircle size={14} />
          {actionError}
        </div>
      )}

      {loading && (
        <div className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>
      )}
      {error && (
        <div className="text-sm py-8 text-center" style={{ color: '#f87171' }}>{error}</div>
      )}

      {!loading && !error && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {rootCategories.length === 0 && (
            <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Категорий нет. Нажмите «Добавить» или запустите seed:categories.
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
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Удалить категорию?</h3>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              Дочерние категории и товары потеряют привязку. Действие необратимо.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-md text-sm font-medium"
                style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 rounded-md text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
              >
                Удалить
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
                {modal === 'create' ? 'Новая категория' : 'Редактировать категорию'}
              </h3>
              <button onClick={closeModal} aria-label="Закрыть"><X size={16} style={{ color: 'var(--text-muted)' }} /></button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-3">
              <Field label="Название (RU) *" value={form.nameRu} onChange={handleNameRuChange} placeholder="Электроника" />
              <Field label="Название (UZ) *" value={form.nameUz} onChange={v => setForm(f => ({ ...f, nameUz: v }))} placeholder="Elektronika" />
              <Field
                label="Slug *"
                value={form.slug}
                onChange={v => setForm(f => ({ ...f, slug: v }))}
                placeholder="electronics"
                hint="Только латиница, цифры, _"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Родитель</label>
                  <select
                    value={form.parentId}
                    onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md text-sm"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    <option value="">— Корневая —</option>
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
                    label="Порядок"
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
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Активна (видна продавцам)</span>
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
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}
              >
                <Save size={13} />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
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
          <ActionBtn onClick={onAddChild} title="Добавить подкатегорию">
            <Plus size={13} />
          </ActionBtn>
        )}
        <ActionBtn onClick={() => onEdit(cat)} title="Редактировать">
          <Pencil size={13} />
        </ActionBtn>
        <ActionBtn onClick={() => onToggle(cat)} title={cat.isActive ? 'Деактивировать' : 'Активировать'}>
          {cat.isActive
            ? <ToggleRight size={14} style={{ color: '#10B981' }} />
            : <ToggleLeft size={14} style={{ color: '#6B7280' }} />
          }
        </ActionBtn>
        <ActionBtn onClick={() => onDelete(cat.id)} title="Удалить" danger>
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
