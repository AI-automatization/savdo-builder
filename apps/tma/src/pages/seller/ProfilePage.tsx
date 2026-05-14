import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { webStoreUrl } from '@/lib/webUrl';

interface Store {
  id: string;
  name: string;
  slug: string;
  status: string;
  telegramChannelId: string | null;
  telegramChannelTitle: string | null;
}

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME ?? 'savdo_builderBOT';

export default function SellerProfilePage() {
  const { user, logout } = useAuth();
  const { tg, user: tgUser } = useTelegram();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    api<Store>('/seller/store', { signal: ac.signal })
      .then((s) => { if (!ac.signal.aborted) setStore(s); })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        showToast('Не удалось загрузить профиль магазина', 'error');
      });
    return () => ac.abort();
  }, []);

  const handleLogout = () => {
    tg?.HapticFeedback.notificationOccurred('warning');
    logout();
    navigate('/', { replace: true });
  };

  const openBot = () => {
    tg?.openTelegramLink(`https://t.me/${BOT_USERNAME}`);
  };

  const copyStoreLink = () => {
    if (!store) return;
    const link = `https://t.me/${BOT_USERNAME}?startapp=store_${store.slug}`;
    navigator.clipboard.writeText(link)
      .then(() => { tg?.HapticFeedback.notificationOccurred('success'); })
      .catch(() => { showToast('Не удалось скопировать ссылку', 'error'); });
    track.storeLinkCopied(store.id);
  };

  return (

      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
        <h1 className="text-base font-bold" style={{ color: 'var(--tg-text-primary)' }}>Профиль</h1>

        {/* Telegram аккаунт */}
        <GlassCard className="p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: 'var(--tg-accent)' }}
          >
            {tgUser?.first_name?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--tg-text-primary)' }}>
              {tgUser?.first_name ?? ''} {tgUser?.last_name ?? ''}
            </p>
            {tgUser?.username && (
              <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>@{tgUser.username}</p>
            )}
            {user?.phone && (
              <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>{user.phone}</p>
            )}
          </div>
          <span
            className="text-xxs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--tg-accent-dim)', color: 'var(--tg-accent)' }}
          >
            Продавец
          </span>
        </GlassCard>

        {/* Магазин — skeleton до прихода ответа */}
        {!store && (
          <GlassCard className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Skeleton style={{ height: 12, width: 100 }} />
              <Skeleton style={{ height: 18, width: 60, borderRadius: 9999 }} />
            </div>
            <Skeleton style={{ height: 16, width: '50%' }} />
            <Skeleton style={{ height: 22, width: 130 }} />
            <Skeleton style={{ height: 12, width: '70%' }} />
          </GlassCard>
        )}

        {/* Магазин */}
        {store && (
          <GlassCard className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
                Мой магазин
              </p>
              <Badge status={store.status} />
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--tg-text-primary)' }}>{store.name}</p>
            <button
              onClick={() => tg?.openLink?.(webStoreUrl(store.slug))}
              className="text-xxs inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity"
              style={{
                color: 'var(--tg-accent)',
                background: 'var(--tg-accent-bg)',
                border: '1px solid var(--tg-accent-border)',
                cursor: 'pointer',
              }}
              aria-label="Перейти на сайт магазина"
            >
              ↗ Перейти на сайт
            </button>

            {store.telegramChannelId ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--tg-text-muted)' }}>
                <span>📢</span>
                <span>{store.telegramChannelTitle ?? store.telegramChannelId}</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)', color: 'rgba(251,191,36,0.80)' }}
              >
                <span>⚠️</span>
                <span>Telegram-канал не привязан — автопостинг отключён</span>
              </div>
            )}

            <button
              onClick={copyStoreLink}
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--tg-accent)' }}
            >
              🔗 Скопировать ссылку на магазин
            </button>
          </GlassCard>
        )}

        {/* Быстрые действия */}
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--tg-text-dim)' }}>
            Действия
          </p>
          <button
            onClick={() => navigate('/seller/store')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'var(--tg-text-secondary)', borderBottom: '1px solid var(--tg-border-soft)' }}
          >
            <span>⚙️</span> Настройки магазина
          </button>
          <button
            onClick={() => navigate('/seller/products')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'var(--tg-text-secondary)', borderBottom: '1px solid var(--tg-border-soft)' }}
          >
            <span>📦</span> Управление товарами
          </button>
          <button
            onClick={() => navigate('/buyer')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(52,211,153,0.85)', borderBottom: '1px solid var(--tg-border-soft)' }}
          >
            <span>🛍</span> Режим покупателя
          </button>
          <button
            onClick={openBot}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'var(--tg-text-secondary)', borderBottom: '1px solid var(--tg-border-soft)' }}
          >
            <span>🤖</span> Открыть бота (@{BOT_USERNAME})
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(248,113,113,0.75)' }}
          >
            <span>🚪</span> Выйти из аккаунта
          </button>
        </GlassCard>

        <p className="text-center text-xxs" style={{ color: 'var(--tg-text-dim)' }}>
          Savdo · Продавец
        </p>
      </div>
    
  );
}
