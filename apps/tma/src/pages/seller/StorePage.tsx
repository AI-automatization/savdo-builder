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

  // StoreCategory state удалён вместе с UI блоком (Polat 07.05 — дубликат
  // с StoreDirectionsPicker). API /seller/categories продолжает работать,
  // вернём UI отдельным экраном если потребуется.

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
          <p style={{ color: 'var(--tg-text-secondary)', fontSize: 14 }}>{fetchError}</p>
          <button
            onClick={() => {
              storeAbortRef.current?.abort();
              const ac = new AbortController();
              storeAbortRef.current = ac;
              loadStore(ac.signal);
            }}
            style={{ padding: '8px 20px', borderRadius: 12, background: 'var(--tg-accent-dim)', color: 'var(--tg-accent)', fontSize: 13, fontWeight: 600, border: '1px solid var(--tg-accent-border)' }}
          >
            Попробовать снова
          </button>
        </div>
      
    );
  }

  if (!store) {
    return (
      
        <div className="flex flex-col gap-4">
          <h1 className="text-base font-bold" style={{ color: 'var(--tg-text-primary)' }}>Мой магазин</h1>
          <div
            className="flex flex-col items-center gap-4 py-8 px-4 rounded-2xl"
            style={{ background: 'var(--tg-accent-bg)', border: '1px solid var(--tg-accent-border)' }}
          >
            <span style={{ fontSize: 44 }}>🏪</span>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: 'var(--tg-text-primary)' }}>Создайте свой магазин</p>
              <p className="text-xs mt-1" style={{ color: 'var(--tg-text-muted)' }}>Введите название чтобы начать продавать</p>
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
                  style={{ background: 'var(--tg-surface-hover)', border: '1px solid var(--tg-border)' }}
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
                  background: creating ? 'var(--tg-accent-bg)' : 'var(--tg-accent)',
                  color: creating ? 'var(--tg-accent-text)' : '#fff',
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
        <h1 className="text-base font-bold" style={isDesktop ? { gridColumn: '1 / -1', color: 'var(--tg-text-primary)' } : { color: 'var(--tg-text-primary)' }}>
          Мой магазин
        </h1>

        {/* Store info */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'var(--tg-accent-dim)', border: '1px solid var(--tg-accent-border)' }}>
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--tg-text-primary)' }}>{store.name}</p>
              {/* Длинный URL раньше ломал layout — теперь короткая «Перейти на сайт» pill */}
              <a
                href={webStoreUrl(store.slug)}
                onClick={(e) => { e.preventDefault(); tg?.openLink?.(webStoreUrl(store.slug)); }}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xxs mt-0.5 px-2 py-0.5 rounded-md"
                style={{
                  color: 'var(--tg-accent)',
                  background: 'var(--tg-accent-bg)',
                  border: '1px solid var(--tg-accent-border)',
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
            <p className="text-xs" style={{ color: 'var(--tg-text-secondary)' }}>{store.description}</p>
          )}

          {store.telegramChannelId && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--tg-text-muted)' }}>
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
              style={{ ...glass, background: 'var(--tg-surface)' }}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none resize-none"
              style={{ ...glass, background: 'var(--tg-surface)' }}
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

        {/* Polat 07.05: блок «Разделы каталога» удалён — был дубликатом с
            StoreDirectionsPicker сверху. categories ещё используются на бэкенде
            (StoreCategory модель + /seller/categories) — здесь UI убран,
            unused state переменные оставлены чтобы не сломать другие файлы
            которые их могут импортировать. Управление разделами вернётся
            отдельным экраном в /seller/store/categories когда будет нужно. */}
      </div>

  );
}
