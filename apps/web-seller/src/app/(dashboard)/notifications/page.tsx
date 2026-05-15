'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, useReadAll } from '../../../hooks/use-notifications';
import type { NotificationItem } from '../../../lib/api/notifications.api';
import { ShoppingCart, CheckCircle, AlertTriangle, Package, Bell } from 'lucide-react';
import { card, cardMuted, colors, dangerTint } from '@/lib/styles';

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  return `${Math.floor(hrs / 24)} дн назад`;
}

function NotifIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (t.includes('заказ') || t.includes('order')) return <ShoppingCart size={18} style={{ color: colors.accent }} />;
  if (t.includes('одобр') || t.includes('approved')) return <CheckCircle size={18} style={{ color: colors.success }} />;
  if (t.includes('откло') || t.includes('reject')) return <AlertTriangle size={18} style={{ color: colors.warning }} />;
  return <Package size={18} style={{ color: colors.accent }} />;
}

const ORDER_ID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// ── Row ───────────────────────────────────────────────────────────────────────

function NotifRow({ item }: { item: NotificationItem }) {
  const router = useRouter();

  function handleClick() {
    const match = item.body.match(ORDER_ID_RE);
    if (match) {
      router.push(`/orders/${match[0]}`);
    }
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-4 px-5 py-4 rounded-lg transition-colors cursor-pointer"
      style={
        item.isRead
          ? cardMuted
          : { background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.background = item.isRead
          ? colors.surfaceElevated
          : `color-mix(in srgb, ${colors.accent} 22%, transparent)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = item.isRead ? colors.surfaceMuted : colors.accentMuted;
      }}
    >
      <span className="flex-shrink-0 mt-0.5"><NotifIcon title={item.title} /></span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{item.title}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: colors.textMuted }}>{item.body}</p>
      </div>
      <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: colors.textDim }}>
        {relativeTime(item.createdAt)}
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-5 py-4 rounded-lg animate-pulse" style={card}>
          <div className="w-7 h-7 rounded-md flex-shrink-0" style={{ background: colors.surfaceElevated }} />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3.5 w-40 rounded" style={{ background: colors.surfaceElevated }} />
            <div className="h-3 w-full rounded" style={{ background: colors.surfaceMuted }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread';

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const { data: items = [], isLoading, isError } = useNotifications();
  const readAll = useReadAll();

  // Auto mark-all-read on mount (fire-and-forget)
  useEffect(() => {
    readAll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = tab === 'unread' ? items.filter(n => !n.isRead) : items;

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Уведомления</h1>
          <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
            Последние {items.length} уведомлений
          </p>
        </div>
        <button
          onClick={() => readAll.mutate()}
          disabled={readAll.isPending}
          className="text-xs px-3 py-1.5 rounded-md transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
        >
          Прочитать все
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['all', 'unread'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-xs px-4 py-1.5 rounded-md transition-colors"
            style={
              tab === t
                ? { background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }
                : { background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }
            }
          >
            {t === 'all' ? 'Все' : 'Непрочитанные'}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <div
          className="rounded-lg px-5 py-4 text-sm"
          style={{ background: dangerTint(0.1), border: `1px solid ${dangerTint(0.25)}`, color: colors.danger }}
        >
          Не удалось загрузить уведомления. Попробуйте обновить страницу.
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-lg px-5 py-10 text-center"
          style={cardMuted}
        >
          <Bell size={28} style={{ color: colors.textDim, margin: '0 auto 8px' }} />
          <p className="text-sm font-medium" style={{ color: colors.textMuted }}>Уведомлений пока нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(item => (
            <NotifRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
