import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmModal';

/**
 * SUBSCRIPTION-TMA-PAGE-001 (08.06.2026):
 *
 * Минимальная страница «Тариф» для seller. Backend GET /seller/subscription
 * (GetCurrentSubscriptionUseCase.requireOrStart) сам авто-стартует TRIAL
 * при первом обращении — нам достаточно навигировать сюда, чтобы тариф включился.
 *
 * Phase 1: оплата ручная — кнопка «Оплатить тариф» открывает чат с владельцем
 * платформы для перевода. Phase 2 — интеграция Click/Payme/MANUAL_TRANSFER UI
 * с прикреплением чека (см. BILLING-MACHINE-001 §3 / Phase 2 roadmap).
 *
 * TODO: i18n — пока хардкод RU. Перевод в ru.ts/uz.ts после слияния parallel
 * workflow (там тоже трогают i18n — избегаем merge-конфликта).
 */

const ACCENT = '#A855F7';
const ACCENT_DARK = '#7C3AED';
const OWNER_TG_HANDLE = 'ismailov_0011'; // Polat (owner)

type Tier = 'STARTER' | 'PRO' | 'BUSINESS';
type Status = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CHURNED' | 'CANCELLED';

interface PlanInfo {
  priceUzs: number | null;
  annualUzs: number | null;
  productsLimit: number | null; // null = безлимит
  ordersLimitPerMonth: number | null;
  features: string[];
}

interface Subscription {
  id: string;
  tier: Tier;
  status: Status;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  daysLeft: number | null;
  plan: PlanInfo;
}

const TIER_LABEL: Record<Tier, string> = {
  STARTER: 'Старт',
  PRO: 'Профи',
  BUSINESS: 'Бизнес',
};

const STATUS_LABEL: Record<Status, { text: string; color: string; bg: string }> = {
  TRIAL: { text: '🎁 Триал', color: '#A855F7', bg: 'rgba(168,85,247,0.15)' },
  ACTIVE: { text: '✅ Активен', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  PAST_DUE: { text: '⚠️ Просрочен', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  SUSPENDED: { text: '⏸ Приостановлен', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  CHURNED: { text: '❌ Отменён', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  CANCELLED: { text: '❌ Отменён', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
};

const FEATURE_LABEL: Record<string, string> = {
  auto_post_channel: '📢 Автопостинг в Telegram канал',
  abandoned_carts: '🛒 Уведомления о брошенных корзинах',
  analytics: '📊 Расширенная аналитика',
  reviews: '⭐ Отзывы покупателей',
  multi_variant: '🎨 Варианты товаров (размер/цвет)',
  bulk_import: '📦 Массовая загрузка товаров',
  priority_support: '🚀 Приоритетная поддержка',
  custom_domain: '🌐 Свой домен',
};

const fmtPrice = (uzs: number | null) =>
  uzs === null ? 'Бесплатно' : `${uzs.toLocaleString('ru')} сум/мес`;

const fmtLimit = (n: number | null) => (n === null ? 'без ограничений' : `${n}`);

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    api<Subscription>('/seller/subscription', { signal: ac.signal, forceFresh: true })
      .then((data) => {
        if (ac.signal.aborted) return;
        setSub(data);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Не удалось загрузить тариф';
        setError(msg);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, []);

  const handleContactOwner = () => {
    tg?.HapticFeedback.impactOccurred('light');
    const text = `Здравствуйте! Хочу оплатить тариф ${sub ? TIER_LABEL[sub.tier] : ''} в Savdo Builder. Расскажите, как.`;
    const url = `https://t.me/${OWNER_TG_HANDLE}?text=${encodeURIComponent(text)}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleCancel = async () => {
    if (!sub) return;
    const ok = await confirmDialog({
      title: 'Отменить подписку?',
      body:
        sub.status === 'TRIAL'
          ? 'Триал будет немедленно прерван. Создание новых товаров заблокируется.'
          : 'Подписка закончится в конце оплаченного периода. Доступ сохранится до этой даты.',
      confirmText: 'Отменить',
      cancelText: 'Нет, оставить',
      danger: true,
    });
    if (!ok) return;
    setCancelling(true);
    try {
      await api('/seller/subscription/cancel', {
        method: 'POST',
        body: { reason: 'user_cancelled_from_tma' },
      });
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('Подписка отменена');
      // Reload
      const fresh = await api<Subscription>('/seller/subscription', { forceFresh: true });
      setSub(fresh);
    } catch (err: unknown) {
      tg?.HapticFeedback.notificationOccurred('error');
      const msg = err instanceof Error ? err.message : 'Не удалось отменить';
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
        <Skeleton style={{ height: 28, width: '40%' }} />
        <Skeleton style={{ height: 180 }} />
        <Skeleton style={{ height: 160 }} />
        <Skeleton style={{ height: 80 }} />
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ color: 'var(--tg-text-secondary)', background: 'var(--tg-surface)' }}
          >
            ← Назад
          </button>
          <h1 className="text-base font-bold" style={{ color: 'var(--tg-text-primary)' }}>
            Тариф
          </h1>
        </div>
        <GlassCard className="p-4 flex flex-col items-center gap-2">
          <span style={{ fontSize: 32 }} aria-hidden="true">😕</span>
          <p style={{ color: 'var(--tg-text-secondary)', fontSize: 14 }}>
            {error ?? 'Подписка недоступна'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs px-3 py-1.5 rounded-lg mt-1"
            style={{ color: ACCENT, background: 'rgba(168,85,247,0.10)' }}
          >
            Повторить
          </button>
        </GlassCard>
      </div>
    );
  }

  const status = STATUS_LABEL[sub.status];
  const canPay = sub.status === 'TRIAL' || sub.status === 'PAST_DUE' || sub.status === 'SUSPENDED' || sub.status === 'ACTIVE';
  const canCancel = (sub.status === 'TRIAL' || sub.status === 'ACTIVE') && !sub.cancelAtPeriodEnd;

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ color: 'var(--tg-text-secondary)', background: 'var(--tg-surface)' }}
        >
          ← Назад
        </button>
        <h1 className="text-base font-bold" style={{ color: 'var(--tg-text-primary)' }}>
          Тариф и подписка
        </h1>
      </div>

      {/* Current plan card */}
      <GlassCard className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xxs uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
              Ваш тариф
            </p>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--tg-text-primary)' }}>
              {TIER_LABEL[sub.tier]}
            </h2>
          </div>
          <span
            className="text-xxs font-semibold px-2.5 py-1 rounded-lg"
            style={{ color: status.color, background: status.bg, border: `1px solid ${status.color}33` }}
          >
            {status.text}
          </span>
        </div>

        {sub.daysLeft !== null && (
          <div className="flex items-center gap-2 mt-1">
            <span style={{ fontSize: 18 }} aria-hidden="true">⏳</span>
            <p className="text-sm" style={{ color: 'var(--tg-text-secondary)' }}>
              {sub.status === 'TRIAL' && `Триал закончится через ${sub.daysLeft} дн.`}
              {sub.status === 'ACTIVE' && `Оплачено до конца периода: ${sub.daysLeft} дн.`}
              {sub.status === 'PAST_DUE' && `Льготный период: осталось ${sub.daysLeft} дн.`}
            </p>
          </div>
        )}

        {sub.cancelAtPeriodEnd && (
          <p className="text-xs" style={{ color: '#F59E0B' }}>
            ⚠️ Подписка отменена и не продлится автоматически. Доступ сохранится до конца оплаченного периода.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div
            className="p-3 rounded-xl"
            style={{ background: 'var(--tg-surface-hover)', border: '1px solid var(--tg-border-soft)' }}
          >
            <p className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>Товары</p>
            <p className="text-sm font-bold" style={{ color: 'var(--tg-text-primary)' }}>
              {fmtLimit(sub.plan.productsLimit)}
            </p>
          </div>
          <div
            className="p-3 rounded-xl"
            style={{ background: 'var(--tg-surface-hover)', border: '1px solid var(--tg-border-soft)' }}
          >
            <p className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>Заказы/мес.</p>
            <p className="text-sm font-bold" style={{ color: 'var(--tg-text-primary)' }}>
              {fmtLimit(sub.plan.ordersLimitPerMonth)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1 pt-3" style={{ borderTop: '1px solid var(--tg-border-soft)' }}>
          <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>Стоимость</p>
          <p className="text-sm font-bold" style={{ color: ACCENT }}>
            {fmtPrice(sub.plan.priceUzs)}
          </p>
        </div>
      </GlassCard>

      {/* Features list */}
      {sub.plan.features.length > 0 && (
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-xxs uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            Что входит
          </p>
          <ul className="flex flex-col gap-2 mt-1">
            {sub.plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--tg-text-primary)' }}>
                {FEATURE_LABEL[f] ?? `• ${f}`}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Pay CTA (Phase 1: manual transfer via TG owner contact) */}
      {canPay && (
        <GlassCard className="p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--tg-text-primary)' }}>
              {sub.status === 'TRIAL' ? 'Перейти на платный тариф' : 'Оплатить продление'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--tg-text-muted)' }}>
              Оплата сейчас — через перевод владельцу платформы. После подтверждения тариф активируется автоматически.
            </p>
          </div>
          <button
            onClick={handleContactOwner}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{
              background: `linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT})`,
              color: '#fff',
            }}
          >
            💬 Написать владельцу для оплаты
          </button>
          <p className="text-xxs text-center" style={{ color: 'var(--tg-text-dim)' }}>
            Click и Payme — скоро. Сейчас только ручной перевод.
          </p>
        </GlassCard>
      )}

      {/* Cancel */}
      {canCancel && (
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-xxs uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            Управление
          </p>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: 'rgba(239,68,68,0.10)',
              color: '#EF4444',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            {cancelling ? 'Отменяем…' : 'Отменить подписку'}
          </button>
        </GlassCard>
      )}

      {/* Help footer */}
      <p className="text-center text-xxs" style={{ color: 'var(--tg-text-dim)' }}>
        Вопросы по тарифу — @{OWNER_TG_HANDLE}
      </p>
    </div>
  );
}
