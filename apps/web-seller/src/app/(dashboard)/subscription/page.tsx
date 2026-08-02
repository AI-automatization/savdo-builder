'use client';

import { useMySubscription, useCancelSubscription } from '@/hooks/use-subscription';
import { useStore } from '@/hooks/use-seller';
import { SubscriptionStatus, SubscriptionTier } from 'types';
import { Check } from 'lucide-react';
import { card, colors, dangerTint } from '@/lib/styles';

// Тарифы — источник правды apps/api/src/modules/subscriptions/plan-config.ts
// (BIZ-DECISIONS-§15, 14.06.2026). Обновлять здесь при изменении там же.
const TIERS: {
  tier: SubscriptionTier;
  name: string;
  priceUzs: number;
  for: string;
  features: string[];
}[] = [
  {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    priceUzs: 0,
    for: 'Старт, тест',
    features: ['до 50 товаров', 'до 50 заказов/мес', 'бейдж «maxsavdo» на витрине', 'поддомен'],
  },
  {
    tier: SubscriptionTier.PRO,
    name: 'Pro',
    priceUzs: 149_000,
    for: 'Активный продавец',
    features: ['товаров ∞, заказов ∞', 'свой домен, без бейджа', 'полная аналитика + брошенные корзины', 'приоритетная поддержка'],
  },
  {
    tier: SubscriptionTier.STUDIO,
    name: 'Studio',
    priceUzs: 399_000,
    for: 'Бренд / несколько магазинов',
    features: ['всё из Pro', 'мульти-стор (roadmap)', 'команда + приоритет', 'экспорт данных'],
  },
];

const STATUS_LABELS: Record<string, string> = {
  [SubscriptionStatus.TRIAL]: 'Пробный период',
  [SubscriptionStatus.ACTIVE]: 'Активна',
  [SubscriptionStatus.PAST_DUE]: 'Просрочена оплата',
  [SubscriptionStatus.SUSPENDED]: 'Приостановлена',
  [SubscriptionStatus.CHURNED]: 'Завершена',
  [SubscriptionStatus.CANCELLED]: 'Отменена',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  [SubscriptionStatus.TRIAL]: { bg: 'rgba(59,130,246,.15)', color: colors.info },
  [SubscriptionStatus.ACTIVE]: { bg: 'rgba(52,211,153,.15)', color: colors.success },
  [SubscriptionStatus.PAST_DUE]: { bg: 'rgba(251,191,36,.13)', color: colors.warning },
  [SubscriptionStatus.SUSPENDED]: { bg: dangerTint(0.13), color: colors.danger },
  [SubscriptionStatus.CHURNED]: { bg: colors.surfaceElevated, color: colors.textDim },
  [SubscriptionStatus.CANCELLED]: { bg: colors.surfaceElevated, color: colors.textDim },
};

const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? 'maxsavdo_bot';

function fmt(n: number) {
  return n.toLocaleString('ru-RU') + ' сум';
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SubscriptionPage() {
  const { data: subscription, isLoading } = useMySubscription();
  const { data: store } = useStore();
  const cancel = useCancelSubscription();

  function payLink(tierName: string, priceUzs: number) {
    const text = `Здравствуйте! Хочу оплатить тариф ${tierName} (${fmt(priceUzs)}/мес) для магазина «${store?.slug ?? ''}».`;
    return `https://t.me/${BOT_USERNAME}?text=${encodeURIComponent(text)}`;
  }

  function handleCancel() {
    if (!window.confirm('Отменить подписку? Доступ к платным функциям пропадёт.')) return;
    cancel.mutate(undefined);
  }

  const statusBadge = subscription ? STATUS_COLORS[subscription.status] : undefined;
  const periodLabel =
    subscription?.status === SubscriptionStatus.TRIAL
      ? `Триал до ${formatDate(subscription.trialEndsAt) ?? '—'}`
      : subscription?.currentPeriodEnd
      ? `Оплачено до ${formatDate(subscription.currentPeriodEnd)}`
      : null;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Тарифы</h1>
        <p className="text-sm mt-0.5" style={{ color: colors.textDim }}>
          Текущая подписка и выбор тарифа
        </p>
      </div>

      {/* Текущий статус */}
      <div className="rounded-lg p-5" style={card}>
        {isLoading ? (
          <div className="h-6 w-48 rounded animate-pulse" style={{ background: colors.surfaceElevated }} />
        ) : subscription ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                {TIERS.find((t) => t.tier === subscription.tier)?.name ?? subscription.tier}
              </span>
              {statusBadge && (
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ background: statusBadge.bg, color: statusBadge.color }}
                >
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {periodLabel && (
                <span className="text-sm" style={{ color: colors.textMuted }}>
                  {periodLabel}
                  {subscription.daysLeft != null && ` · осталось ${subscription.daysLeft} дн.`}
                </span>
              )}
              {(subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.TRIAL) && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancel.isPending}
                  className="text-xs font-medium px-3 py-1.5 rounded-md transition-opacity disabled:opacity-50"
                  style={{ color: colors.danger, border: `1px solid ${colors.danger}` }}
                >
                  Отменить подписку
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: colors.textDim }}>Не удалось загрузить подписку</p>
        )}
      </div>

      {/* Тарифы */}
      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => {
          const isCurrent = subscription?.tier === t.tier;
          return (
            <div
              key={t.tier}
              className="rounded-lg p-5 flex flex-col gap-3"
              style={isCurrent ? { ...card, borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` } : card}
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: isCurrent ? colors.accent : colors.textDim }}>
                  {t.name}
                </span>
                <p className="text-xl font-bold mt-1" style={{ color: colors.textPrimary }}>
                  {t.priceUzs === 0 ? '0' : fmt(t.priceUzs)}
                  {t.priceUzs > 0 && <span className="text-xs font-normal" style={{ color: colors.textDim }}> /мес</span>}
                </p>
                <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{t.for}</p>
              </div>
              <ul className="flex flex-col gap-1.5 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs" style={{ color: colors.textMuted }}>
                    <Check size={14} style={{ color: colors.success, flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="text-xs font-semibold text-center py-2 rounded-md" style={{ background: colors.accentMuted, color: colors.accent }}>
                  Текущий тариф
                </div>
              ) : t.priceUzs === 0 ? (
                <div className="text-xs text-center py-2" style={{ color: colors.textDim }}>—</div>
              ) : (
                <a
                  href={payLink(t.name, t.priceUzs)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-center py-2 rounded-md transition-opacity hover:opacity-90"
                  style={{ background: colors.accent, color: colors.accentTextOnBg }}
                >
                  Оплатить в Telegram
                </a>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs" style={{ color: colors.textDim }}>
        Оплата пока проходит вручную: кнопка открывает чат с ботом с готовым сообщением — мы подтвердим оплату и активируем тариф.
      </p>
    </div>
  );
}
