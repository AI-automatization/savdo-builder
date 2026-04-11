import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME ?? 'savdo_builderBOT';

export default function BuyerProfilePage() {
  const { user, authenticated, logout } = useAuth();
  const { tg, user: tgUser } = useTelegram();
  const navigate = useNavigate();

  const handleLogout = () => {
    tg?.HapticFeedback.notificationOccurred('warning');
    logout();
    navigate('/', { replace: true });
  };

  const openBot = () => {
    tg?.openTelegramLink(`https://t.me/${BOT_USERNAME}`);
  };

  return (
    <AppShell role="BUYER">
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Профиль</h1>

        {/* Аккаунт */}
        <GlassCard className="p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: authenticated ? 'linear-gradient(135deg, #059669, #34d399)' : 'rgba(255,255,255,0.10)' }}
          >
            {tgUser?.first_name?.[0] ?? '👤'}
          </div>
          <div className="flex-1 min-w-0">
            {authenticated && tgUser ? (
              <>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
                  {tgUser.first_name} {tgUser.last_name ?? ''}
                </p>
                {tgUser.username && (
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>@{tgUser.username}</p>
                )}
                {user?.phone && (
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>{user.phone}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>Гость</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>Войдите чтобы делать заказы</p>
              </>
            )}
          </div>
          {authenticated && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
            >
              Покупатель
            </span>
          )}
        </GlassCard>

        {/* Хочешь стать продавцом? */}
        {authenticated && (
          <GlassCard className="p-4 flex items-center gap-3">
            <span style={{ fontSize: 28 }}>🏪</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Хочешь продавать?</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>Открой магазин прямо в боте</p>
            </div>
            <button
              onClick={openBot}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0"
              style={{ background: 'rgba(167,139,250,0.18)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)' }}
            >
              Открыть бота
            </button>
          </GlassCard>
        )}

        {/* Действия */}
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Действия
          </p>

          {authenticated && (
            <button
              onClick={() => navigate('/buyer/orders')}
              className="flex items-center gap-3 py-2.5 text-sm"
              style={{ color: 'rgba(255,255,255,0.70)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span>📦</span> Мои заказы
            </button>
          )}

          <button
            onClick={openBot}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(255,255,255,0.70)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>🤖</span> Написать боту (@{BOT_USERNAME})
          </button>

          {authenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 py-2.5 text-sm"
              style={{ color: 'rgba(248,113,113,0.75)' }}
            >
              <span>🚪</span> Выйти из аккаунта
            </button>
          )}
        </GlassCard>

        {!authenticated && (
          <div
            className="p-4 rounded-2xl text-center"
            style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}
          >
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Вы просматриваете магазины как гость.<br />
              Для заказов нужно войти через Telegram.
            </p>
            <button
              onClick={openBot}
              className="mt-3 text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: 'rgba(167,139,250,0.20)', color: '#A78BFA' }}
            >
              Войти через @{BOT_USERNAME}
            </button>
          </div>
        )}

        <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Savdo · Покупатель
        </p>
      </div>
    </AppShell>
  );
}
