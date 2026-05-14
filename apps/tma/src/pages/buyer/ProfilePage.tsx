import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { applyAsSeller } from '@/lib/auth';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from '@/lib/i18n';

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME ?? 'savdo_builderBOT';

export default function BuyerProfilePage() {
  const { user, authenticated, logout, reauth } = useAuth();
  const { tg, user: tgUser } = useTelegram();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);

  // Продавцы не должны быть на странице покупателя
  useEffect(() => {
    if (user?.role === 'SELLER' || user?.role === 'ADMIN') {
      navigate('/seller/profile', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    tg?.HapticFeedback.notificationOccurred('warning');
    logout();
    navigate('/', { replace: true });
  };

  const openBot = () => {
    tg?.openTelegramLink(`https://t.me/${BOT_USERNAME}`);
  };

  const handleBecomeSeller = async () => {
    setApplying(true);
    try {
      await applyAsSeller();
      await reauth();
      tg?.HapticFeedback.notificationOccurred('success');
      navigate('/seller', { replace: true });
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setApplying(false);
    }
  };

  return (

      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
        <h1 className="text-base font-bold" style={{ color: 'var(--tg-text-primary)' }}>{t('profile.title')}</h1>

        {/* Аккаунт */}
        <GlassCard className="p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: authenticated ? 'linear-gradient(135deg, #059669, #34d399)' : 'var(--tg-surface-hover)' }}
          >
            {tgUser?.first_name?.[0] ?? '👤'}
          </div>
          <div className="flex-1 min-w-0">
            {authenticated && tgUser ? (
              <>
                <p className="text-sm font-semibold" style={{ color: 'var(--tg-text-primary)' }}>
                  {tgUser.first_name} {tgUser.last_name ?? ''}
                </p>
                {tgUser.username && (
                  <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>@{tgUser.username}</p>
                )}
                {user?.phone && (
                  <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>{user.phone}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-semibold" style={{ color: 'var(--tg-text-secondary)' }}>{t('auth.guest')}</p>
                <p className="text-xs" style={{ color: 'var(--tg-text-dim)' }}>{t('auth.guestSubtitle')}</p>
              </>
            )}
          </div>
          {authenticated && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
            >
              {t('profile.role.buyer')}
            </span>
          )}
        </GlassCard>

        {/* Хочешь стать продавцом? — только для покупателей */}
        {authenticated && user?.role === 'BUYER' && (
          <GlassCard className="p-4 flex items-center gap-3">
            <span style={{ fontSize: 28 }}>🏪</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--tg-text-primary)' }}>{t('profile.becomeSellerTitle')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tg-text-muted)' }}>
                {applying ? t('profile.becomeSellerApplying') : t('profile.becomeSellerSubtitle')}
              </p>
            </div>
            <button
              onClick={handleBecomeSeller}
              disabled={applying}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0"
              style={{
                background: applying ? 'var(--tg-accent-bg)' : 'var(--tg-accent-dim)',
                color: applying ? 'var(--tg-accent-text)' : 'var(--tg-accent)',
                border: '1px solid var(--tg-accent-border)',
                cursor: applying ? 'wait' : 'pointer',
              }}
            >
              {applying ? '...' : t('profile.becomeSellerCta')}
            </button>
          </GlassCard>
        )}

        {/* Действия */}
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--tg-text-dim)' }}>
            {t('profile.actions')}
          </p>

          {authenticated && (
            <button
              onClick={() => navigate('/buyer/orders')}
              className="flex items-center gap-3 py-2.5 text-sm"
              style={{ color: 'var(--tg-text-secondary)', borderBottom: '1px solid var(--tg-border-soft)' }}
            >
              <span>📦</span> {t('orders.title')}
            </button>
          )}

          <button
            onClick={openBot}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'var(--tg-text-secondary)', borderBottom: '1px solid var(--tg-border-soft)' }}
          >
            <span>🤖</span> {t('profile.tgBotButton', { bot: BOT_USERNAME })}
          </button>

          {authenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 py-2.5 text-sm"
              style={{ color: 'rgba(248,113,113,0.75)' }}
            >
              <span>🚪</span> {t('auth.logout')}
            </button>
          )}
        </GlassCard>

        {!authenticated && (
          <div
            className="p-4 rounded-2xl text-center"
            style={{ background: 'var(--tg-accent-bg)', border: '1px solid var(--tg-accent-border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--tg-text-secondary)' }}>
              {t('auth.guestBanner')}
            </p>
            <button
              onClick={openBot}
              className="mt-3 text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: 'var(--tg-accent-dim)', color: 'var(--tg-accent)' }}
            >
              {t('auth.loginViaBot', { bot: BOT_USERNAME })}
            </button>
          </div>
        )}

        <p className="text-center text-[10px]" style={{ color: 'var(--tg-text-dim)' }}>
          {t('profile.footer')}
        </p>
      </div>

  );
}
