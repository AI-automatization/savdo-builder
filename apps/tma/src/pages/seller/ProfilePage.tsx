import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

interface Store {
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

  useEffect(() => {
    api<Store>('/seller/store')
      .then((s) => setStore(s))
      .catch(() => {});
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
    navigator.clipboard.writeText(link).catch(() => {});
    tg?.HapticFeedback.notificationOccurred('success');
  };

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Профиль</h1>

        {/* Telegram аккаунт */}
        <GlassCard className="p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
          >
            {tgUser?.first_name?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
              {tgUser?.first_name ?? ''} {tgUser?.last_name ?? ''}
            </p>
            {tgUser?.username && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>@{tgUser.username}</p>
            )}
            {user?.phone && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>{user.phone}</p>
            )}
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(167,139,250,0.18)', color: '#A78BFA' }}
          >
            Продавец
          </span>
        </GlassCard>

        {/* Магазин */}
        {store && (
          <GlassCard className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Мой магазин
              </p>
              <Badge status={store.status} />
            </div>
            <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.88)' }}>{store.name}</p>
            <p className="text-[11px]" style={{ color: 'rgba(167,139,250,0.70)' }}>savdo.uz/{store.slug}</p>

            {store.telegramChannelId ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
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
              style={{ color: '#A78BFA' }}
            >
              🔗 Скопировать ссылку на магазин
            </button>
          </GlassCard>
        )}

        {/* Быстрые действия */}
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Действия
          </p>
          <button
            onClick={() => navigate('/seller/store')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(255,255,255,0.70)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>⚙️</span> Настройки магазина
          </button>
          <button
            onClick={() => navigate('/seller/products')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(255,255,255,0.70)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>📦</span> Управление товарами
          </button>
          <button
            onClick={() => navigate('/buyer')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(52,211,153,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>🛍</span> Режим покупателя
          </button>
          <button
            onClick={openBot}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(255,255,255,0.70)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
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

        <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Savdo · Продавец
        </p>
      </div>
    </AppShell>
  );
}
