"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useAuth } from "@/lib/auth/context";
import { useNotifications, useReadAll } from "@/hooks/use-notifications";
import type { NotificationItem } from "@/lib/api/notifications.api";
import { CheckCircle, Truck, Package, XCircle, ShoppingBag, Bell } from "lucide-react";

// ── Glass tokens ───────────────────────────────────────────────────────────

const glass = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.13)",
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

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
  if (t.includes("подтверждён") || t.includes("confirm")) return <CheckCircle size={18} style={{ color: '#22C55E' }} />;
  if (t.includes("отправлен") || t.includes("ship")) return <Truck size={18} style={{ color: '#A78BFA' }} />;
  if (t.includes("доставлен") || t.includes("deliver")) return <Package size={18} style={{ color: '#A78BFA' }} />;
  if (t.includes("отменён") || t.includes("cancel")) return <XCircle size={18} style={{ color: '#EF4444' }} />;
  if (t.includes("заказ") || t.includes("order")) return <ShoppingBag size={18} style={{ color: '#A78BFA' }} />;
  return <Bell size={18} style={{ color: '#A78BFA' }} />;
}

const ORDER_ID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// ── Row ────────────────────────────────────────────────────────────────────

function NotifRow({ item }: { item: NotificationItem }) {
  const router = useRouter();

  function handleClick() {
    const match = item.body.match(ORDER_ID_RE);
    if (match) router.push(`/orders/${match[0]}`);
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl active:opacity-70 transition-opacity"
      style={
        item.isRead
          ? { ...glass, opacity: 0.65 }
          : { ...glass, background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.22)" }
      }
    >
      <span className="text-xl flex-shrink-0 mt-0.5"><NotifIcon title={item.title} /></span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-semibold text-white leading-snug">{item.title}</p>
          <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>
            {relativeTime(item.createdAt)}
          </span>
        </div>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>
          {item.body}
        </p>
      </div>
      {!item.isRead && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
          style={{ background: "#A78BFA", boxShadow: "0 0 6px rgba(167,139,250,0.7)" }}
        />
      )}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5 rounded-2xl animate-pulse" style={glass}>
          <div className="w-7 h-7 rounded-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3.5 w-36 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-3 w-full rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Auth gate ──────────────────────────────────────────────────────────────

function AuthGate() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
      <Bell size={40} style={{ color: 'rgba(255,255,255,0.4)' }} />
      <p className="text-base font-semibold text-white">Войдите, чтобы видеть уведомления</p>
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
        Уведомления об изменении статуса заказов и другие важные события
      </p>
      <button
        onClick={() => router.push("/profile")}
        className="mt-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)", boxShadow: "0 8px 24px rgba(167,139,250,.35)" }}
      >
        Войти
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

type Tab = "all" | "unread";

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const { data: items = [], isLoading, isError } = useNotifications();
  const readAll = useReadAll();

  // Auto mark-all-read on mount
  useEffect(() => {
    if (isAuthenticated) readAll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const unreadItems = items.filter((n) => !n.isRead);
  const filtered = tab === "unread" ? unreadItems : items;

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}
    >
      {/* Glow orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 340, height: 340, top: -100, right: -70, background: "radial-gradient(circle, rgba(167,139,250,.18) 0%, transparent 70%)", filter: "blur(32px)" }} />
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-5 pb-28" style={{ zIndex: 1 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">Уведомления</h1>
            {isAuthenticated && items.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {items.length} уведомлений
              </p>
            )}
          </div>
          {isAuthenticated && unreadItems.length > 0 && (
            <button
              onClick={() => readAll.mutate()}
              disabled={readAll.isPending}
              className="text-xs px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: "rgba(167,139,250,0.15)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.25)" }}
            >
              Прочитать все
            </button>
          )}
        </div>

        {!isAuthenticated ? (
          <AuthGate />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {(["all", "unread"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="text-xs px-4 py-1.5 rounded-xl transition-all"
                  style={
                    tab === t
                      ? { background: "rgba(167,139,250,0.20)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.30)" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }
                  }
                >
                  {t === "all" ? "Все" : `Непрочитанные${unreadItems.length > 0 ? ` (${unreadItems.length})` : ""}`}
                </button>
              ))}
            </div>

            {/* Content */}
            {isLoading ? (
              <Skeleton />
            ) : isError ? (
              <div className="rounded-2xl px-4 py-4 text-sm text-center" style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.20)", color: "rgba(248,113,113,.85)" }}>
                Не удалось загрузить уведомления
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl py-14 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Bell size={32} style={{ color: 'rgba(255,255,255,0.3)', margin: '0 auto 8px' }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
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
