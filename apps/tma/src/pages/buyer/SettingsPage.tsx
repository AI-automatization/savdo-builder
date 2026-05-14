import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTranslation, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME ?? 'savdo_builderBOT';

const LOCALE_LABEL: Record<Locale, string> = {
  ru: 'Русский',
  uz: 'Oʻzbek',
};

export default function BuyerSettingsPage() {
  const { user, authenticated, logout } = useAuth();
  const { tg, user: tgUser } = useTelegram();
  const { t, locale, setLocale } = useTranslation();
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

        <h1 className="text-base font-bold" style={{ color: 'var(--tg-text-primary)' }}>{t('settings.title')}</h1>

        {/* ── Аккаунт ── */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            {t('settings.account')}
          </p>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{
                background: authenticated
                  ? 'linear-gradient(135deg, #059669, #34d399)'
                  : 'var(--tg-surface-hover)',
              }}
            >
              {tgUser?.first_name?.[0]?.toUpperCase() ?? '👤'}
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
                <p className="text-sm" style={{ color: 'var(--tg-text-muted)' }}>{t('auth.guest')}</p>
              )}
            </div>
            {authenticated && (
              <span
                className="text-xxs font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
              >
                {t('settings.role.buyer')}
              </span>
            )}
          </div>
        </GlassCard>

        {/* ── Тема оформления ── */}
        <GlassCard className="p-4 flex flex-col gap-2.5">
          <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            {t('settings.theme')}
          </p>
          <ThemeToggle />
          <p className="text-xxs" style={{ color: 'var(--tg-text-dim)' }}>
            {t('settings.themeHint')}
          </p>
        </GlassCard>

        {/* ── Язык / MARKETING-LOCALIZATION-UZ-001 ── */}
        <GlassCard className="p-4 flex flex-col gap-2.5">
          <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            {t('settings.language')}
          </p>
          <div className="flex gap-2">
            {SUPPORTED_LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => {
                  tg?.HapticFeedback.selectionChanged();
                  setLocale(l);
                }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: locale === l ? 'var(--tg-accent-dim)' : 'var(--tg-surface-hover)',
                  color: locale === l ? 'var(--tg-accent)' : 'var(--tg-text-secondary)',
                  border: `1px solid ${locale === l ? 'var(--tg-accent-border)' : 'var(--tg-border-soft)'}`,
                  minHeight: 40,
                }}
                aria-pressed={locale === l}
              >
                {LOCALE_LABEL[l]}
              </button>
            ))}
          </div>
          <p className="text-xxs" style={{ color: 'var(--tg-text-dim)' }}>
            {t('settings.languageHint')}
          </p>
        </GlassCard>

        {/* ── Стать продавцом ── */}
        {canBecomeSeller && (
          <GlassCard className="p-4 flex flex-col gap-3">
            <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
              {t('settings.becomeSeller')}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--tg-text-secondary)' }}>
              {t('settings.becomeSellerHint')}
            </p>
            <button
              type="button"
              onClick={handleBecomeSeller}
              aria-label={t('settings.becomeSellerCta')}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
                color: '#0b1220',
                minHeight: 44,
              }}
            >
              {t('settings.becomeSellerCta')}
            </button>
          </GlassCard>
        )}

        {/* ── Приложение ── */}
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-xxs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--tg-text-dim)' }}>
            {t('settings.app')}
          </p>

          <button
            onClick={() => tg?.openTelegramLink(`https://t.me/${BOT_USERNAME}`)}
            className="flex items-center justify-between py-2.5 text-sm"
            style={{ color: 'var(--tg-text-secondary)', borderBottom: '1px solid var(--tg-border-soft)' }}
          >
            <span className="flex items-center gap-3">
              <span>🤖</span> {t('settings.tgBot')}
            </span>
            <span style={{ color: 'var(--tg-text-dim)', fontSize: 12 }}>@{BOT_USERNAME} →</span>
          </button>

          <button
            onClick={() => navigate('/buyer/orders')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'var(--tg-text-secondary)', borderBottom: '1px solid var(--tg-border-soft)' }}
          >
            <span>📦</span> {t('orders.title')}
          </button>

          <button
            onClick={() => navigate('/buyer')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'var(--tg-text-secondary)', borderBottom: '1px solid var(--tg-border-soft)' }}
          >
            <span>🏪</span> {t('nav.stores')}
          </button>

          {authenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 py-2.5 text-sm"
              style={{ color: 'rgba(248,113,113,0.80)' }}
            >
              <span>🚪</span> {t('auth.logout')}
            </button>
          )}
        </GlassCard>

        <p className="text-center text-xxs" style={{ color: 'var(--tg-text-dim)' }}>
          Savdo · v1.0
        </p>

      </div>

  );
}
