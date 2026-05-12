import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME ?? 'savdo_builderBOT';

export default function BuyerSettingsPage() {
  const { user, authenticated, logout } = useAuth();
  const { tg, user: tgUser } = useTelegram();
  const navigate = useNavigate();

  const handleLogout = () => {
    tg?.HapticFeedback.notificationOccurred('warning');
    logout();
    navigate('/', { replace: true });
  };

  const handleBecomeSeller = () => {
    tg?.HapticFeedback.impactOccurred('medium');
    tg?.openTelegramLink(`https://t.me/${BOT_USERNAME}?start=become_seller`);
  };

  const canBecomeSeller = authenticated && user?.role === 'BUYER';

  return (

      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">

        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Настройки</h1>

        {/* ── Аккаунт ── */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Аккаунт
          </p>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{
                background: authenticated
                  ? 'linear-gradient(135deg, #059669, #34d399)'
                  : 'rgba(255,255,255,0.10)',
              }}
            >
              {tgUser?.first_name?.[0]?.toUpperCase() ?? '👤'}
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
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Гость</p>
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
          </div>
        </GlassCard>

        {/* ── Тема оформления ── */}
        <GlassCard className="p-4 flex flex-col gap-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            Тема оформления
          </p>
          <ThemeToggle />
          <p className="text-[10px]" style={{ color: 'var(--tg-text-dim)' }}>
            Авто — синхронизация с Telegram. Можно зафиксировать вручную.
          </p>
        </GlassCard>

        {/* ── Стать продавцом ── */}
        {canBecomeSeller && (
          <GlassCard className="p-4 flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Открыть свой магазин
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Продавайте на Savdo: создайте магазин, добавьте товары и принимайте заказы в Telegram.
            </p>
            <button
              type="button"
              onClick={handleBecomeSeller}
              aria-label="Стать продавцом — продолжить в Telegram-боте"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
                color: '#0b1220',
                minHeight: 44,
              }}
            >
              🏪 Стать продавцом
            </button>
          </GlassCard>
        )}

        {/* ── Приложение ── */}
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Приложение
          </p>

          <button
            onClick={() => tg?.openTelegramLink(`https://t.me/${BOT_USERNAME}`)}
            className="flex items-center justify-between py-2.5 text-sm"
            style={{ color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="flex items-center gap-3">
              <span>🤖</span> Telegram-бот
            </span>
            <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 12 }}>@{BOT_USERNAME} →</span>
          </button>

          <button
            onClick={() => navigate('/buyer/orders')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>📦</span> Мои заказы
          </button>

          <button
            onClick={() => navigate('/buyer')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>🏪</span> Каталог магазинов
          </button>

          {authenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 py-2.5 text-sm"
              style={{ color: 'rgba(248,113,113,0.80)' }}
            >
              <span>🚪</span> Выйти из аккаунта
            </button>
          )}
        </GlassCard>

        <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Savdo · v1.0
        </p>

      </div>
    
  );
}
