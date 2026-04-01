import {
  Users,
  Store,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  PauseCircle,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { BGPattern } from "@/components/ui/bg-pattern";

const stats = [
  {
    label: "Продавцы",
    value: "1 284",
    delta: "+12%",
    up: true,
    icon: Users,
    color: "#818CF8",
    bg: "rgba(129,140,248,0.12)",
  },
  {
    label: "Магазины",
    value: "847",
    delta: "+7%",
    up: true,
    icon: Store,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
  },
  {
    label: "Заказы сегодня",
    value: "234",
    delta: "+18%",
    up: true,
    icon: ShoppingCart,
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
  },
  {
    label: "Выручка (UZS)",
    value: "42.6M",
    delta: "-3%",
    up: false,
    icon: TrendingUp,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
  },
];

const moderationQueue = [
  { type: "sellers", count: 3,  label: "Продавцов на проверке" },
  { type: "stores",  count: 7,  label: "Магазинов на проверке" },
];

const recentOrders = [
  { id: "#ORD-1091", buyer: "Азиз Каримов",   store: "TechShop",     amount: "450 000 UZS", status: "PENDING",   time: "2 мин назад" },
  { id: "#ORD-1090", buyer: "Малика Усманова", store: "Flora Boutique", amount: "120 000 UZS", status: "PAID",     time: "15 мин назад" },
  { id: "#ORD-1089", buyer: "Санжар Юсупов",  store: "HomeDecor",    amount: "890 000 UZS", status: "CANCELLED", time: "42 мин назад" },
  { id: "#ORD-1088", buyer: "Зилола Мирзаева", store: "SportShop",   amount: "230 000 UZS", status: "PAID",      time: "1 час назад" },
  { id: "#ORD-1087", buyer: "Фирдавс Нуров",  store: "KidsWorld",    amount: "75 000 UZS",  status: "PENDING",   time: "2 часа назад" },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Ожидает",  cls: "badge-pending" },
  PAID:      { label: "Оплачен",  cls: "badge-approved" },
  CANCELLED: { label: "Отменён",  cls: "badge-rejected" },
};

const recentActions = [
  { action: "Магазин одобрен",          entity: "Малика Shop",       time: "5 мин",  icon: CheckCircle, color: "#10B981" },
  { action: "Продавец отклонён",        entity: "Ойдин Усманова",    time: "12 мин", icon: XCircle,     color: "#EF4444" },
  { action: "Магазин приостановлен",    entity: "FashionUz",         time: "1 час",  icon: PauseCircle, color: "#F59E0B" },
];

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("ru", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative p-6 flex flex-col gap-6">
      <BGPattern variant="dots" mask="fade-edges" size={20} fill="rgba(129,140,248,0.05)" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text)", letterSpacing: "-0.01em" }}>
            Обзор платформы
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {today}
          </p>
        </div>
        <Link href="/moderation" className="btn-primary" style={{ fontSize: "13px" }}>
          Очередь модерации
          <span
            style={{
              background: "rgba(255,255,255,0.25)",
              borderRadius: "20px",
              padding: "1px 7px",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            {moderationQueue.reduce((a, b) => a + b.count, 0)}
          </span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Alert banner */}
      <div
        className="admin-card flex items-center gap-4"
        style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)" }}
      >
        <AlertTriangle size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
            Очередь модерации требует внимания
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {moderationQueue[0].count} продавцов и {moderationQueue[1].count} магазинов ожидают проверки
          </p>
        </div>
        <Link href="/moderation" className="btn-ghost" style={{ whiteSpace: "nowrap", fontSize: "12.5px" }}>
          Перейти <ArrowRight size={13} />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, delta, up, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: bg }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <span className={up ? "stat-delta-up" : "stat-delta-down"}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {delta}
              </span>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Moderation queue quick cards */}
      <div className="grid grid-cols-2 gap-4">
        {moderationQueue.map(item => (
          <Link
            key={item.type}
            href={`/moderation?tab=${item.type}`}
            className="admin-card flex flex-col gap-2 no-underline"
            style={{ cursor: "pointer" }}
          >
            <div className="text-3xl font-bold" style={{ color: "#F59E0B", letterSpacing: "-0.02em" }}>
              {item.count}
            </div>
            <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {item.label}
            </div>
            <div
              className="flex items-center gap-1 text-xs font-semibold mt-1"
              style={{ color: "var(--color-primary)" }}
            >
              Открыть <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom grid: recent orders + recent actions */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent orders — 2/3 width */}
        <div className="col-span-2">
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Последние заказы
          </h3>
          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Покупатель</th>
                  <th>Магазин</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Время</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => {
                  const st = statusMap[order.status];
                  return (
                    <tr key={order.id}>
                      <td>
                        <span
                          className="font-mono text-xs font-semibold"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {order.id}
                        </span>
                      </td>
                      <td>{order.buyer}</td>
                      <td style={{ color: "var(--color-text-muted)" }}>{order.store}</td>
                      <td className="font-semibold">{order.amount}</td>
                      <td>
                        <span className={`badge-status ${st.cls}`}>{st.label}</span>
                      </td>
                      <td style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>
                        {order.time}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent actions — 1/3 width */}
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Последние действия
          </h3>
          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            {recentActions.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3"
                style={{
                  borderBottom:
                    i < recentActions.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${item.color}18` }}
                >
                  <item.icon size={14} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: "var(--color-text)" }}>
                    {item.action}
                  </div>
                  <div
                    className="text-xs truncate mt-0.5"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {item.entity}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {item.time} назад
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
