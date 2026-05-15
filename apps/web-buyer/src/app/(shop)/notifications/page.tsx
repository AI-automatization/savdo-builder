"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useAuth } from "@/lib/auth/context";
import { useNotifications, useReadAll } from "@/hooks/use-notifications";
import type { NotificationItem } from "@/lib/api/notifications.api";
import { CheckCircle, Truck, Package, XCircle, ShoppingBag, Bell } from "lucide-react";
import { colors } from "@/lib/styles";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч`;
  return `${Math.floor(hrs / 24)} дн`;
}

type Bucket = "today" | "yesterday" | "week" | "earlier";

const BUCKET_LABEL: Record<Bucket, string> = {
  today: "Сегодня",
  yesterday: "Вчера",
  week: "На прошлой неделе",
  earlier: "Ранее",
};

function bucketFor(iso: string): Bucket {
  const ms = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (ms < day) return "today";
  if (ms < 2 * day) return "yesterday";
  if (ms < 7 * day) return "week";
  return "earlier";
}

function NotifIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (t.includes("подтверждён") || t.includes("confirm")) return <CheckCircle size={16} style={{ color: colors.success }} />;
  if (t.includes("отправлен") || t.includes("ship")) return <Truck size={16} style={{ color: colors.brand }} />;
  if (t.includes("доставлен") || t.includes("deliver")) return <Package size={16} style={{ color: colors.brand }} />;
  if (t.includes("отменён") || t.includes("cancel")) return <XCircle size={16} style={{ color: colors.danger }} />;
  if (t.includes("заказ") || t.includes("order")) return <ShoppingBag size={16} style={{ color: colors.brand }} />;
  return <Bell size={16} style={{ color: colors.brand }} />;
}

const ORDER_ID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// ── Row ──────────────────────────────────────────────────────────────────────

function NotifRow({ item }: { item: NotificationItem }) {
  const router = useRouter();

  // Навигация только если в тексте есть order-UUID. Иначе строка не кликабельна —
  // не показываем cursor-pointer/hover, чтобы не было «мёртвого» аффорданса.
  const orderMatch = item.body.match(ORDER_ID_RE);
  const target = orderMatch ? `/orders/${orderMatch[0]}` : null;

  return (
    <div
      onClick={target ? () => router.push(target) : undefined}
      className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${target ? 'cursor-pointer hover:opacity-90' : ''}`}
      style={{
        background: item.isRead ? colors.surface : colors.brandMuted,
        borderBottom: `1px solid ${colors.divider}`,
      }}
    >
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: colors.surfaceSunken }}
      >
        <NotifIcon title={item.title} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-[13px] leading-snug"
            style={{ color: colors.textStrong, fontWeight: item.isRead ? 600 : 700 }}
          >
            {item.title}
          </p>
          <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: colors.textMuted }}>
            {relativeTime(item.createdAt)}
          </span>
        </div>
        <p className="text-[11px] mt-1 leading-relaxed line-clamp-2" style={{ color: colors.textBody }}>
          {item.body}
        </p>
      </div>
      {!item.isRead && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
          style={{ background: colors.brand }}
        />
      )}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-4 py-3.5"
          style={{ background: colors.surface, borderBottom: `1px solid ${colors.divider}` }}
        >
          <div className="w-8 h-8 rounded-md flex-shrink-0 animate-pulse" style={{ background: colors.surfaceMuted }} />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 w-36 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
            <div className="h-2.5 w-full rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AuthGate ─────────────────────────────────────────────────────────────────

function AuthGate() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
        — Уведомления
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: colors.textStrong }}>
        Войдите чтобы видеть уведомления
      </h2>
      <p className="text-sm mb-6 max-w-sm" style={{ color: colors.textMuted }}>
        Уведомления об изменении статуса заказов и другие важные события
      </p>
      <button
        onClick={() => router.push("/profile")}
        className="px-6 py-3 rounded-md text-sm font-bold transition-opacity hover:opacity-90"
        style={{ background: colors.brand, color: colors.brandTextOnBg }}
      >
        Войти
      </button>
    </div>
  );
}

type Tab = "all" | "unread";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const { data: items = [], isLoading, isError } = useNotifications();
  const readAll = useReadAll();

  const unreadItems = useMemo(() => items.filter((n) => !n.isRead), [items]);

  // Mark-all-as-read once items have loaded and there's something unread.
  // Without this guard Strict Mode + back/forward fired the mutation on every
  // mount, even with 0 unread.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isLoading) return;
    if (readAll.isPending) return;
    if (unreadItems.length === 0) return;
    readAll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, unreadItems.length]);
  const filtered = tab === "unread" ? unreadItems : items;

  // Group by bucket
  const grouped = useMemo(() => {
    const g: Record<Bucket, NotificationItem[]> = { today: [], yesterday: [], week: [], earlier: [] };
    filtered.forEach((it) => g[bucketFor(it.createdAt)].push(it));
    return g;
  }, [filtered]);

  const orderedBuckets: Bucket[] = ["today", "yesterday", "week", "earlier"];

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textStrong }}>
      {/* Header */}
      <div
        className="px-4 py-3.5 border-b flex items-center justify-between gap-3"
        style={{ background: colors.surface, borderColor: colors.divider }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.textStrong }}>Уведомления</h1>
          {isAuthenticated && items.length > 0 && (
            <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
              {items.length} {items.length === 1 ? "уведомление" : items.length < 5 ? "уведомления" : "уведомлений"}
            </p>
          )}
        </div>
        {isAuthenticated && unreadItems.length > 0 && (
          <button
            onClick={() => readAll.mutate()}
            disabled={readAll.isPending}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-md transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: colors.brandMuted, color: colors.brand }}
          >
            Прочитать все
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto pb-28 md:pb-12">
        {!isAuthenticated ? (
          <AuthGate />
        ) : (
          <>
            {/* Filter chips */}
            <div className="px-4 py-2.5 flex gap-1.5">
              {(["all", "unread"] as Tab[]).map((t) => {
                const active = tab === t;
                const label = t === "all"
                  ? `Все · ${items.length}`
                  : `Непрочитанные${unreadItems.length > 0 ? ` · ${unreadItems.length}` : ""}`;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded transition"
                    style={
                      active
                        ? { background: colors.textStrong, color: colors.brandTextOnBg }
                        : { background: colors.surface, color: colors.textBody, border: `1px solid ${colors.border}` }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {isLoading && <Skeleton />}

            {isError && (
              <p className="text-sm py-8 px-4 text-center" style={{ color: colors.danger }}>
                Не удалось загрузить уведомления
              </p>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
                  — Пусто
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: colors.textStrong }}>
                  {tab === "unread" ? "Нет непрочитанных" : "Уведомлений пока нет"}
                </h2>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Когда что-то случится с заказом — появится здесь
                </p>
              </div>
            )}

            {!isLoading && !isError && filtered.length > 0 && (
              <div>
                {orderedBuckets.map((b) => {
                  const list = grouped[b];
                  if (list.length === 0) return null;
                  return (
                    <div key={b}>
                      <div className="px-4 pt-5 pb-2 text-[10px] tracking-[0.18em] uppercase" style={{ color: colors.textMuted }}>
                        — {BUCKET_LABEL[b]}
                      </div>
                      <div>
                        {list.map((item) => (
                          <NotifRow key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNavBar active="notifications" />
    </div>
  );
}
