import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { track } from '@/lib/analytics';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { glass } from '@/lib/styles';

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
  const { tg } = useTelegram();
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
  // Create store flow
  const [fetchError, setFetchError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [newStoreTg, setNewStoreTg] = useState('');
  const [createError, setCreateError] = useState('');

  const botUsername = (import.meta.env.VITE_BOT_USERNAME as string) ?? '';
  const storeLink = (s: Store) =>
    botUsername
      ? `https://t.me/${botUsername}?startapp=store_${s.slug}`
      : `https://savdo.uz/${s.slug}`;

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

  useEffect(() => {
    setLoading(true);
    setStore(null);
    setFetchError('');
    api<Store>('/seller/store')
      .then((s) => {
        setStore(s);
        setName(s.name);
        setDescription(s.description ?? '');
      })
      .catch((err: unknown) => {
        // 404 = магазина нет → показываем форму создания (это нормально)
        // Всё остальное — реальная ошибка, показываем пользователю
        if (!(err instanceof ApiError && err.status === 404)) {
          setFetchError('Не удалось загрузить данные магазина. Проверьте соединение и попробуйте снова.');
        }
      })
      .finally(() => setLoading(false));
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
    return <AppShell role="SELLER"><div className="flex justify-center py-10"><Spinner size={32} /></div></AppShell>;
  }

  if (fetchError) {
    return (
      <AppShell role="SELLER">
        <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
          <span style={{ fontSize: 36 }}>⚠️</span>
          <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 14 }}>{fetchError}</p>
          <button
            onClick={() => { setFetchError(''); setLoading(true); api<Store>('/seller/store').then((s) => { setStore(s); setName(s.name); setDescription(s.description ?? ''); }).catch((err: unknown) => { if (!(err instanceof ApiError && err.status === 404)) setFetchError('Не удалось загрузить данные магазина. Проверьте соединение и попробуйте снова.'); }).finally(() => setLoading(false)); }}
            style={{ padding: '8px 20px', borderRadius: 12, background: 'rgba(167,139,250,0.18)', color: '#A78BFA', fontSize: 13, fontWeight: 600, border: '1px solid rgba(167,139,250,0.3)' }}
          >
            Попробовать снова
          </button>
        </div>
      </AppShell>
    );
  }

  if (!store) {
    return (
      <AppShell role="SELLER">
        <div className="flex flex-col gap-4">
          <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Мой магазин</h1>
          <div
            className="flex flex-col items-center gap-4 py-8 px-4 rounded-2xl"
            style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.18)' }}
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
                  background: creating ? 'rgba(167,139,250,0.15)' : 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                  color: creating ? 'rgba(167,139,250,0.50)' : '#fff',
                  cursor: creating ? 'wait' : 'pointer',
                }}
              >
                {creating ? 'Создаём...' : 'Создать магазин'}
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Мой магазин</h1>

        <GlassCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'rgba(167,139,250,0.20)', border: '1px solid rgba(167,139,250,0.25)' }}>
              🏪
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>{store.name}</p>
              <p className="text-[11px]" style={{ color: 'rgba(167,139,250,0.80)' }}>savdo.uz/{store.slug}</p>
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
            {store.status === 'APPROVED' || store.isPublic ? (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => togglePublish(store)}
                disabled={publishing}
              >
                {publishing
                  ? '...'
                  : store.isPublic
                  ? '🔴 Скрыть магазин'
                  : '🟢 Опубликовать магазин'}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate(`/buyer/store/${store.slug}`)}
            >
              👁 Посмотреть каталог
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
