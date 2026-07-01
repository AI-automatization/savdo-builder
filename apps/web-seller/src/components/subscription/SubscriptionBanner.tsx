'use client';

import type { SubscriptionDto } from 'types';
import { colors, dangerTint, warningTint } from '@/lib/styles';

// Показываем trial-баннер только когда осталось ≤ 7 дней
const TRIAL_WARN_DAYS = 7;

interface Props {
  subscription: SubscriptionDto;
}

export function SubscriptionBanner({ subscription }: Props) {
  const { status, daysLeft, graceEndsAt } = subscription;

  if (status === 'TRIAL') {
    if ((daysLeft ?? Infinity) > TRIAL_WARN_DAYS) return null;
    const days = daysLeft ?? 0;
    return (
      <Banner
        color="warning"
        icon="⏳"
        message={
          days <= 0
            ? 'Триал закончился — активируйте подписку, чтобы магазин оставался открытым.'
            : `Триал заканчивается через ${days} ${pluralDays(days)} — активируйте подписку.`
        }
        action={{ label: 'Связаться с поддержкой', href: 'https://t.me/maxsavdo_bot' }}
      />
    );
  }

  if (status === 'PAST_DUE') {
    const graceDays = graceEndsAt ? daysUntil(graceEndsAt) : null;
    return (
      <Banner
        color="danger"
        icon="⚠️"
        message={
          graceDays !== null && graceDays > 0
            ? `Оплата просрочена. До заморозки магазина ${graceDays} ${pluralDays(graceDays)} — оплатите подписку.`
            : 'Оплата просрочена — магазин скоро будет заморожен. Оплатите подписку.'
        }
        action={{ label: 'Оплатить', href: 'https://t.me/maxsavdo_bot' }}
        bold
      />
    );
  }

  if (status === 'SUSPENDED' || status === 'CHURNED') {
    return (
      <Banner
        color="danger"
        icon="🔒"
        message="Магазин заморожен и недоступен покупателям. Свяжитесь с поддержкой для возобновления."
        action={{ label: 'Связаться', href: 'https://t.me/maxsavdo_bot' }}
        bold
      />
    );
  }

  return null;
}

// ── Suspended overlay — накрывает весь основной контент ───────────────────────

export function SuspendedOverlay() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6"
      style={{
        background: `rgba(10,10,10,0.72)`,
        backdropFilter: 'blur(4px)',
        zIndex: 20,
      }}
    >
      <span className="text-4xl">🔒</span>
      <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>
        Магазин заморожен
      </p>
      <p className="text-sm max-w-xs" style={{ color: colors.textMuted }}>
        Оплата подписки просрочена. Магазин скрыт от покупателей.
        Управление временно недоступно.
      </p>
      <a
        href="https://t.me/maxsavdo_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: colors.accent, color: colors.accentTextOnBg }}
      >
        Возобновить подписку
      </a>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface BannerProps {
  color: 'warning' | 'danger';
  icon: string;
  message: string;
  action?: { label: string; href: string };
  bold?: boolean;
}

function Banner({ color, icon, message, action, bold }: BannerProps) {
  const isWarning = color === 'warning';
  const bg = isWarning ? warningTint(0.12) : dangerTint(0.12);
  const border = isWarning ? warningTint(0.35) : dangerTint(0.35);
  const text = isWarning ? colors.warning : colors.danger;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm flex-shrink-0"
      style={{ background: bg, borderBottom: `1px solid ${border}` }}
    >
      <span className="flex-shrink-0 text-base">{icon}</span>
      <p
        className="flex-1 min-w-0"
        style={{ color: text, fontWeight: bold ? 600 : 400 }}
      >
        {message}
      </p>
      {action && (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-3 py-1 rounded-md text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: isWarning ? warningTint(0.25) : dangerTint(0.25), color: text, border: `1px solid ${border}` }}
        >
          {action.label}
        </a>
      )}
    </div>
  );
}

function pluralDays(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'день';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'дня';
  return 'дней';
}

function daysUntil(isoDate: string): number {
  const ms = new Date(isoDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
