'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, useReadAll } from '../../../hooks/use-notifications';
import type { NotificationItem } from '../../../lib/api/notifications.api';

// ── Glass token ───────────────────────────────────────────────────────────────

const glass = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.11)',
} as const;

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

function notifIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('заказ') || t.includes('order')) return '🛒';
  if (t.includes('одобр') || t.includes('approved')) return '✅';
  if (t.includes('откло') || t.includes('reject')) return '⚠️';
  return '📦';
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
      className="flex items-start gap-4 px-5 py-4 rounded-2xl transition-opacity hover:opacity-80 cursor-pointer"
      style={item.isRead ? { ...glass, opacity: 0.7 } : { ...glass, background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.20)' }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{notifIcon(item.title)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{item.title}</p>
        <p className="text-xs mt-0.5 text-white/50 leading-relaxed">{item.body}</p>
      </div>
      <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
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
        <div key={i} className="flex items-start gap-4 px-5 py-4 rounded-2xl animate-pulse" style={glass}>
          <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3.5 w-40 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-3 w-full rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
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
          <h1 className="text-xl font-bold text-white">Уведомления</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Последние {items.length} уведомлений
          </p>
        </div>
        <button
          onClick={() => readAll.mutate()}
          disabled={readAll.isPending}
          className="text-xs px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)' }}
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
            className="text-xs px-4 py-1.5 rounded-xl transition-all"
            style={
              tab === t
                ? { background: 'rgba(167,139,250,0.20)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.30)' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }
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
          className="rounded-2xl px-5 py-4 text-sm"
          style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', color: 'rgba(248,113,113,0.85)' }}
        >
          Не удалось загрузить уведомления. Попробуйте обновить страницу.
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-2xl px-5 py-10 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-2xl mb-2">🔔</p>
          <p className="text-sm font-medium text-white/60">Уведомлений пока нет</p>
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
