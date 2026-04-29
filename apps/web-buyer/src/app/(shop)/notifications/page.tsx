"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useAuth } from "@/lib/auth/context";
import { useNotifications, useReadAll } from "@/hooks/use-notifications";
import type { NotificationItem } from "@/lib/api/notifications.api";
import { CheckCircle, Truck, Package, XCircle, ShoppingBag, Bell } from "lucide-react";
import { colors } from "@/lib/styles";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч`;
  return `${Math.floor(hrs / 24)} дн`;
}

function NotifIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (t.includes("подтверждён") || t.includes("confirm")) return <CheckCircle size={18} style={{ color: colors.success }} />;
  if (t.includes("отправлен") || t.includes("ship")) return <Truck size={18} style={{ color: colors.accent }} />;
  if (t.includes("доставлен") || t.includes("deliver")) return <Package size={18} style={{ color: colors.accent }} />;
  if (t.includes("отменён") || t.includes("cancel")) return <XCircle size={18} style={{ color: colors.danger }} />;
  if (t.includes("заказ") || t.includes("order")) return <ShoppingBag size={18} style={{ color: colors.accent }} />;
  return <Bell size={18} style={{ color: colors.accent }} />;
}

const ORDER_ID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function NotifRow({ item }: { item: NotificationItem }) {
  const router = useRouter();

  function handleClick() {
    const match = item.body.match(ORDER_ID_RE);
    if (match) router.push(`/orders/${match[0]}`);
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5"
      style={
        item.isRead
          ? { background: colors.surface, border: `1px solid ${colors.border}`, opacity: 0.78 }
          : { background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }
      }
    >
      <span className="flex-shrink-0 mt-0.5"><NotifIcon title={item.title} /></span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-semibold leading-snug" style={{ color: colors.textPrimary }}>{item.title}</p>
          <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: colors.textDim }}>
            {relativeTime(item.createdAt)}
          </span>
        </div>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: colors.textMuted }}>
          {item.body}
        </p>
      </div>
      {!item.isRead && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
          style={{ background: colors.accent }}
        />
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-4 py-3.5 rounded-2xl animate-pulse"
          style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <div className="w-7 h-7 rounded-xl flex-shrink-0" style={{ background: colors.surfaceMuted }} />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3.5 w-36 rounded-full" style={{ background: colors.surfaceMuted }} />
            <div className="h-3 w-full rounded-full" style={{ background: colors.surfaceMuted }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AuthGate() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
      <Bell size={40} style={{ color: colors.textDim }} />
      <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>Войдите, чтобы видеть уведомления</p>
      <p className="text-sm" style={{ color: colors.textMuted }}>
        Уведомления об изменении статуса заказов и другие важные события
      </p>
      <button
        onClick={() => router.push("/profile")}
        className="mt-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: colors.accent, color: colors.accentTextOnBg }}
      >
        Войти
      </button>
    </div>
  );
}

type Tab = "all" | "unread";

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const { data: items = [], isLoading, isError } = useNotifications();
  const readAll = useReadAll();

  useEffect(() => {
    if (isAuthenticated) readAll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const unreadItems = items.filter((n) => !n.isRead);
  const filtered = tab === "unread" ? unreadItems : items;

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-28 md:pb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: colors.textPrimary }}>Уведомления</h1>
            {isAuthenticated && items.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                {items.length} уведомлений
              </p>
            )}
          </div>
          {isAuthenticated && unreadItems.length > 0 && (
            <button
              onClick={() => readAll.mutate()}
              disabled={readAll.isPending}
              className="text-xs px-3 py-1.5 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
            >
              Прочитать все
            </button>
          )}
        </div>

        {!isAuthenticated ? (
          <AuthGate />
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              {(["all", "unread"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="text-xs px-4 py-1.5 rounded-xl transition-all"
                  style={
                    tab === t
                      ? { background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }
                      : { background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }
                  }
                >
                  {t === "all" ? "Все" : `Непрочитанные${unreadItems.length > 0 ? ` (${unreadItems.length})` : ""}`}
                </button>
              ))}
            </div>

            {isLoading ? (
              <Skeleton />
            ) : isError ? (
              <div
                className="rounded-2xl px-4 py-4 text-sm text-center"
                style={{ background: 'rgba(220,38,38,0.08)', border: `1px solid rgba(220,38,38,0.30)`, color: colors.danger }}
              >
                Не удалось загрузить уведомления
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="rounded-2xl py-14 text-center"
                style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
              >
                <Bell size={32} style={{ color: colors.textDim, margin: '0 auto 8px' }} />
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  {tab === "unread" ? "Нет непрочитанных" : "Уведомлений пока нет"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((item) => (
                  <NotifRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNavBar active="profile" />
    </div>
  );
}
