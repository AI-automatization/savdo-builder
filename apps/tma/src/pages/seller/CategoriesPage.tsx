import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spinner } from '@/components/ui/Spinner';
import { glass } from '@/lib/styles';

interface StoreCategory {
  id: string;
  name: string;
  sortOrder: number;
}

const MAX_CATEGORIES = 20;

const inputStyle = {
  ...glass,
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  padding: '10px 14px',
  borderRadius: 10,
} as const;

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add form
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit state: categoryId → draft name
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tg?.BackButton.show();
    tg?.BackButton.onClick(() => navigate('/seller/store'));
    return () => { tg?.BackButton.hide(); tg?.BackButton.offClick(() => navigate('/seller/store')); };
  }, [navigate, tg]);

  const fetchCategories = () => {
    setError('');
    api<StoreCategory[]>('/seller/categories')
      .then(setCategories)
      .catch(() => setError('Не удалось загрузить категории'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (categories.length >= MAX_CATEGORIES) return;
    setAdding(true);
    setAddError('');
    try {
      const created = await api<StoreCategory>('/seller/categories', {
        method: 'POST',
        body: { name },
      });
      setCategories((prev) => [...prev, created]);
      setNewName('');
      tg?.HapticFeedback.notificationOccurred('success');
      newInputRef.current?.focus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка при создании';
      setAddError(msg);
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (cat: StoreCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSave = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const updated = await api<StoreCategory>(`/seller/categories/${id}`, {
        method: 'PATCH',
        body: { name },
      });
      setCategories((prev) => prev.map((c) => c.id === id ? updated : c));
      setEditingId(null);
      tg?.HapticFeedback.notificationOccurred('success');
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: StoreCategory) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      if (tg?.showConfirm) {
        tg.showConfirm(`Удалить категорию «${cat.name}»?`, resolve);
      } else {
        resolve(window.confirm(`Удалить категорию «${cat.name}»?`));
      }
    });
    if (!confirmed) return;

    setDeletingId(cat.id);
    try {
      await api(`/seller/categories/${cat.id}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      tg?.HapticFeedback.notificationOccurred('success');
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setDeletingId(null);
    }
  };

  const atLimit = categories.length >= MAX_CATEGORIES;

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>
            Категории
          </h1>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-lg"
            style={{
              background: atLimit ? 'rgba(239,68,68,0.12)' : 'rgba(167,139,250,0.12)',
              color: atLimit ? 'rgba(239,68,68,0.80)' : 'rgba(167,139,250,0.80)',
              border: `1px solid ${atLimit ? 'rgba(239,68,68,0.20)' : 'rgba(167,139,250,0.20)'}`,
            }}
          >
            {categories.length}/{MAX_CATEGORIES}
          </span>
        </div>

        {/* Add form */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <label
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Новая категория
          </label>
          <div className="flex gap-2">
            <input
              ref={newInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Например: Одежда"
              maxLength={100}
              disabled={atLimit || adding}
              style={{ ...inputStyle, flex: 1, opacity: atLimit ? 0.4 : 1 }}
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || atLimit || adding}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                background: !newName.trim() || atLimit || adding
                  ? 'rgba(167,139,250,0.08)'
                  : 'rgba(124,58,237,0.25)',
                border: '1px solid rgba(167,139,250,0.25)',
                color: !newName.trim() || atLimit || adding ? 'rgba(167,139,250,0.35)' : '#A855F7',
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
                cursor: !newName.trim() || atLimit || adding ? 'not-allowed' : 'pointer',
              }}
            >
              {adding ? '...' : '＋'}
            </button>
          </div>
          {atLimit && (
            <p className="text-[11px]" style={{ color: 'rgba(239,68,68,0.70)' }}>
              Достигнут лимит в 20 категорий
            </p>
          )}
          {addError && (
            <p className="text-[11px]" style={{ color: 'rgba(239,68,68,0.80)' }}>{addError}</p>
          )}
        </GlassCard>

        {/* List */}
        {loading && <div className="flex justify-center py-6"><Spinner /></div>}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-8">
            <span style={{ fontSize: 32 }}>⚠️</span>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{error}</p>
            <button
              onClick={() => { setLoading(true); fetchCategories(); }}
              className="text-xs"
              style={{ color: '#A855F7' }}
            >
              Повторить
            </button>
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>🏷️</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              Категорий пока нет — добавьте первую
            </p>
          </div>
        )}

        {categories.map((cat) => {
          const isEditing = editingId === cat.id;
          const isDeleting = deletingId === cat.id;

          return (
            <GlassCard key={cat.id} className="p-3.5 flex flex-col gap-2">
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(cat.id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    maxLength={100}
                    autoFocus
                    style={{ ...inputStyle, flex: 1, fontSize: 13 }}
                  />
                  <button
                    onClick={() => handleSave(cat.id)}
                    disabled={!editName.trim() || saving}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(52,211,153,0.15)',
                      border: '1px solid rgba(52,211,153,0.25)',
                      color: 'rgba(52,211,153,0.90)',
                      fontSize: 13,
                      fontWeight: 600,
                      flexShrink: 0,
                      cursor: !editName.trim() || saving ? 'not-allowed' : 'pointer',
                      opacity: !editName.trim() || saving ? 0.5 : 1,
                    }}
                  >
                    {saving ? '...' : '✓'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 13,
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: 'rgba(167,139,250,0.12)', color: 'rgba(167,139,250,0.70)' }}
                  >
                    #
                  </div>
                  <p className="flex-1 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {cat.name}
                  </p>
                  <button
                    onClick={() => startEdit(cat)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: 'rgba(167,139,250,0.08)',
                      border: '1px solid rgba(167,139,250,0.15)',
                      color: 'rgba(167,139,250,0.70)',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={isDeleting}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      color: isDeleting ? 'rgba(239,68,68,0.30)' : 'rgba(239,68,68,0.65)',
                      fontSize: 13,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isDeleting ? '...' : '✕'}
                  </button>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </AppShell>
  );
}
