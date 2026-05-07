import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { track } from '@/lib/analytics';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { confirmDialog } from '@/components/ui/ConfirmModal';
import { StoreDirectionsPicker } from '@/components/seller/StoreDirectionsPicker';
import { glass } from '@/lib/styles';
import { webStoreUrl } from '@/lib/webUrl';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  isPublic: boolean;
  telegramChannelId: string | null;
  telegramChannelTitle: string | null;
}

interface StoreCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export default function SellerStorePage() {
  const { tg, viewportWidth } = useTelegram();
  const isDesktop = (viewportWidth ?? 0) >= 1024;
  const navigate = useNavigate();
  const { authVersion } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Categories inline
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [catInput, setCatInput] = useState('');
  const [catAdding, setCatAdding] = useState(false);
  const [catDeletingId, setCatDeletingId] = useState<string | null>(null);
  const catInputRef = useRef<HTMLInputElement>(null);

  // Create store flow
  const [fetchError, setFetchError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [newStoreTg, setNewStoreTg] = useState('');
  const [createError, setCreateError] = useState('');

  const botUsername = (import.meta.env.VITE_BOT_USERNAME as string) ?? '';
  // Mini App deep-link если бот настроен, иначе публичная веб-витрина.
  const storeLink = (s: Store) =>
    botUsername
      ? `https://t.me/${botUsername}?startapp=store_${s.slug}`
      : webStoreUrl(s.slug);

  const copyLink = async (s: Store) => {
    try {
      await navigator.clipboard.writeText(storeLink(s));
      tg?.HapticFeedback.notificationOccurred('success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track.storeLinkCopied(s.id);
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
    }
  };

  const togglePublish = async (s: Store) => {
    setPublishing(true);
    try {
      const endpoint = s.isPublic ? '/seller/store/unpublish' : '/seller/store/publish';
      const updated = await api<Store>(endpoint, { method: 'POST' });
      setStore(updated);
      tg?.HapticFeedback.notificationOccurred('success');
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setPublishing(false);
    }
  };

  const storeAbortRef = useRef<AbortController | null>(null);
  const catsAbortRef = useRef<AbortController | null>(null);

  const loadStore = useCallback((signal: AbortSignal) => {
    setLoading(true);
    setStore(null);
    setFetchError('');
    api<Store>('/seller/store', { signal })
      .then((s) => {
        if (signal.aborted) return;
        setStore(s);
        setName(s.name);
        setDescription(s.description ?? '');
      })
      .catch((err: unknown) => {
        if (signal.aborted) return;
        if (!(err instanceof ApiError && err.status === 404)) {
          setFetchError('Не удалось загрузить данные магазина. Проверьте соединение и попробуйте снова.');
        }
      })
      .finally(() => { if (!signal.aborted) setLoading(false); });
  }, []);

  useEffect(() => {
    storeAbortRef.current?.abort();
    const ac = new AbortController();
    storeAbortRef.current = ac;
    loadStore(ac.signal);
    return () => ac.abort();
  }, [authVersion, loadStore]);

  useEffect(() => {
    catsAbortRef.current?.abort();
    const ac = new AbortController();
    catsAbortRef.current = ac;
    api<StoreCategory[]>('/seller/categories', { signal: ac.signal })
      .then((cats) => { if (!ac.signal.aborted) setCategories(cats); })
      .catch(() => {});
    return () => ac.abort();
  }, [authVersion]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const updated = await api<Store>('/seller/store', {
        method: 'PATCH',
        body: { name: name.trim(), description: description.trim() || null },
      });
      setStore(updated);
      setEditing(false);
      tg?.HapticFeedback.notificationOccurred('success');
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    const n = catInput.trim();
    if (!n || categories.length >= 20) return;
    setCatAdding(true);
    try {
      const created = await api<StoreCategory>('/seller/categories', {
        method: 'POST',
        body: { name: n },
      });
      setCategories((prev) => [...prev, created]);
      setCatInput('');
      tg?.HapticFeedback.notificationOccurred('success');
      catInputRef.current?.focus();
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setCatAdding(false);
    }
  };

  const deleteCategory = async (cat: StoreCategory) => {
    const confirmed = await confirmDialog({
      title: `Удалить «${cat.name}»?`,
      confirmText: 'Удалить',
      danger: true,
    });
    if (!confirmed) return;
    setCatDeletingId(cat.id);
    try {
      await api(`/seller/categories/${cat.id}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      tg?.HapticFeedback.notificationOccurred('success');
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setCatDeletingId(null);
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) { setCreateError('Введите название магазина'); return; }
    if (!newStoreCity.trim()) { setCreateError('Введите город'); return; }
    if (!newStoreTg.trim()) { setCreateError('Введите ссылку Telegram для связи'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const created = await api<Store>('/seller/store', {
        method: 'POST',
        body: {
          name: newStoreName.trim(),
          city: newStoreCity.trim(),
          telegramContactLink: newStoreTg.trim(),
        },
      });
      setStore(created);
      setName(created.name);
      setDescription(created.description ?? '');
      tg?.HapticFeedback.notificationOccurred('success');
    } catch {
      setCreateError('Не удалось создать магазин. Попробуйте снова.');
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Spinner size={32} /></div>;
  }

  if (fetchError) {
    return (
      
        <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
          <span style={{ fontSize: 36 }}>⚠️</span>
          <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 14 }}>{fetchError}</p>
          <button
            onClick={() => {
              storeAbortRef.current?.abort();
              const ac = new AbortController();
              storeAbortRef.current = ac;
              loadStore(ac.signal);
            }}
            style={{ padding: '8px 20px', borderRadius: 12, background: 'rgba(168,85,247,0.18)', color: '#A855F7', fontSize: 13, fontWeight: 600, border: '1px solid rgba(168,85,247,0.3)' }}
          >
            Попробовать снова
          </button>
        </div>
      
    );
  }

  if (!store) {
    return (
      
        <div className="flex flex-col gap-4">
          <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Мой магазин</h1>
          <div
            className="flex flex-col items-center gap-4 py-8 px-4 rounded-2xl"
            style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.18)' }}
          >
            <span style={{ fontSize: 44 }}>🏪</span>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Создайте свой магазин</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>Введите название чтобы начать продавать</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              {[
                { value: newStoreName, set: setNewStoreName, placeholder: 'Название магазина', max: 255 },
                { value: newStoreCity, set: setNewStoreCity, placeholder: 'Город (например: Ташкент)', max: 100 },
                { value: newStoreTg,   set: setNewStoreTg,   placeholder: 'Telegram ссылка: @username или https://t.me/...', max: 200 },
              ].map((field) => (
                <input
                  key={field.placeholder}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.max}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              ))}
              {createError && (
                <p className="text-xs" style={{ color: 'rgba(248,113,113,0.85)' }}>{createError}</p>
              )}
              <button
                onClick={handleCreateStore}
                disabled={creating}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{
                  background: creating ? 'rgba(168,85,247,0.15)' : 'linear-gradient(135deg, #7C3AED, #A855F7)',
                  color: creating ? 'rgba(168,85,247,0.50)' : '#fff',
                  cursor: creating ? 'wait' : 'pointer',
                }}
              >
                {creating ? 'Создаём...' : 'Создать магазин'}
              </button>
            </div>
          </div>
        </div>
      
    );
  }

  return (

      <div className={`grid gap-5 ${isDesktop ? 'max-w-screen-xl' : 'max-w-4xl'} mx-auto w-full`}
        style={isDesktop ? { gridTemplateColumns: '1.1fr 1fr', alignItems: 'start' } : undefined}
      >
        <h1 className="text-base font-bold" style={isDesktop ? { gridColumn: '1 / -1', color: 'rgba(255,255,255,0.90)' } : { color: 'rgba(255,255,255,0.90)' }}>
          Мой магазин
        </h1>

        {/* Store info */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'rgba(168,85,247,0.20)', border: '1px solid rgba(168,85,247,0.25)' }}>
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>{store.name}</p>
              {/* Длинный URL раньше ломал layout — теперь короткая «Перейти на сайт» pill */}
              <a
                href={webStoreUrl(store.slug)}
                onClick={(e) => { e.preventDefault(); tg?.openLink?.(webStoreUrl(store.slug)); }}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] mt-0.5 px-2 py-0.5 rounded-md"
                style={{
                  color: '#A855F7',
                  background: 'rgba(168,85,247,0.10)',
                  border: '1px solid rgba(168,85,247,0.25)',
                  textDecoration: 'none',
                  width: 'fit-content',
                }}
                aria-label="Перейти на сайт магазина"
              >
                ↗ Перейти на сайт
              </a>
            </div>
            <Badge status={store.status} />
          </div>

          {store.description && !editing && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>{store.description}</p>
          )}

          {store.telegramChannelId && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
              <span>📢</span>
              <span>{store.telegramChannelTitle ?? store.telegramChannelId}</span>
            </div>
          )}
        </GlassCard>

        {/* FEAT-002 (Polat 06.05): направления магазина — multi-select autocomplete */}
        <GlassCard className="p-4">
          <StoreDirectionsPicker />
        </GlassCard>

        {/* Edit form or actions */}
        {editing ? (
          <div className="flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название магазина"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
              style={{ ...glass, background: 'rgba(255,255,255,0.05)' }}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none resize-none"
              style={{ ...glass, background: 'rgba(255,255,255,0.05)' }}
            />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button variant="ghost" className="w-full" onClick={() => setEditing(true)}>
              ✏️ Редактировать
            </Button>
            <Button className="w-full" onClick={() => copyLink(store)}>
              {copied ? '✅ Ссылка скопирована!' : '🔗 Скопировать ссылку'}
            </Button>
            {(store.status === 'APPROVED' || store.isPublic) && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => togglePublish(store)}
                disabled={publishing}
              >
                {publishing ? '...' : store.isPublic ? '🔴 Скрыть магазин' : '🟢 Опубликовать магазин'}
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate(`/buyer/store/${store.slug}`)}
            >
              👁 Посмотреть каталог
            </Button>
          </div>
        )}

        {/* Store categories — собственные «полки» магазина для группировки
            товаров (Кружки, Футболки…). НЕ путать с направлениями магазина
            выше — то глобальные категории Savdo для поиска магазина в каталоге. */}
        <GlassCard className="p-4 flex flex-col gap-3" style={isDesktop ? { gridColumn: '1 / -1' } : undefined}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Разделы каталога
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Свои «полки» внутри магазина для группировки товаров
              </p>
            </div>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
              style={{
                background: categories.length >= 20 ? 'rgba(239,68,68,0.12)' : 'rgba(167,139,250,0.10)',
                color: categories.length >= 20 ? 'rgba(239,68,68,0.70)' : 'rgba(167,139,250,0.60)',
              }}
            >
              {categories.length}/20
            </span>
          </div>

          {/* Existing categories as chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(167,139,250,0.12)',
                    border: '1px solid rgba(167,139,250,0.20)',
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {cat.name}
                  </span>
                  <button
                    onClick={() => deleteCategory(cat)}
                    disabled={catDeletingId === cat.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0 2px',
                      cursor: catDeletingId === cat.id ? 'not-allowed' : 'pointer',
                      color: catDeletingId === cat.id ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)',
                      fontSize: 12,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add input */}
          {categories.length < 20 && (
            <div className="flex gap-2">
              <input
                ref={catInputRef}
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                placeholder="Например: Одежда, Электроника..."
                maxLength={100}
                className="flex-1 px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={addCategory}
                disabled={!catInput.trim() || catAdding}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: catInput.trim() && !catAdding ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(167,139,250,0.20)',
                  color: catInput.trim() && !catAdding ? '#A855F7' : 'rgba(167,139,250,0.30)',
                  fontSize: 16,
                  fontWeight: 500,
                  flexShrink: 0,
                  cursor: catInput.trim() && !catAdding ? 'pointer' : 'not-allowed',
                }}
              >
                {catAdding ? '…' : '+'}
              </button>
            </div>
          )}

          {categories.length === 0 && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Укажите направления — покупатели найдут вас по поиску в каталоге
            </p>
          )}
        </GlassCard>
      </div>
    
  );
}
