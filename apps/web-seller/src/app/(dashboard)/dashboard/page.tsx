// ── Glass tokens ──────────────────────────────────────────────────────────────

const glass = {
  background:           "rgba(255,255,255,0.08)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border:               "1px solid rgba(255,255,255,0.13)",
} as const;

const glassDim = {
  background:           "rgba(255,255,255,0.04)",
  backdropFilter:       "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border:               "1px solid rgba(255,255,255,0.08)",
} as const;

// ── Mock data ─────────────────────────────────────────────────────────────────

const METRICS = [
  { label: "Заказов сегодня",   value: "12",          delta: "+3",  positive: true,  icon: "📦" },
  { label: "Выручка (месяц)",   value: "4 280 000 сум", delta: "+18%", positive: true,  icon: "💰" },
  { label: "Товаров активных",  value: "24",          delta: "",    positive: true,  icon: "🛍" },
  { label: "Новых сообщений",   value: "7",           delta: "",    positive: false, icon: "💬" },
];

const RECENT_ORDERS = [
  { id: "2401", buyer: "Азиз К.",    total: "1 200 000", status: "pending",   statusLabel: "Ожидает" },
  { id: "2400", buyer: "Санжар Р.",  total: "890 000",   status: "confirmed", statusLabel: "Подтверждён" },
  { id: "2399", buyer: "Дилноза М.", total: "2 100 000", status: "shipping",  statusLabel: "В пути" },
  { id: "2398", buyer: "Камол Т.",   total: "560 000",   status: "delivered", statusLabel: "Доставлен" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   "rgba(251,191,36,.80)",
  confirmed: "rgba(96,165,250,.80)",
  shipping:  "rgba(167,139,250,.90)",
  delivered: "rgba(52,211,153,.80)",
};

const fmt = (n: string) => n + " сум";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">Добро пожаловать 👋</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.42)" }}>
          Магазин: <span style={{ color: "#A78BFA" }}>Nike Uzbekistan</span>
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <div key={m.label} className="rounded-2xl p-4" style={glass}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{m.icon}</span>
              {m.delta && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: m.positive ? "rgba(52,211,153,.15)" : "rgba(239,68,68,.15)", color: m.positive ? "#34d399" : "#f87171" }}
                >
                  {m.delta}
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-white leading-none">{m.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm font-semibold text-white">Последние заказы</p>
          <a href="/orders" className="text-xs font-medium" style={{ color: "#A78BFA" }}>Все заказы →</a>
        </div>
        <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
          {RECENT_ORDERS.map((o) => (
            <div key={o.id} className="flex items-center gap-4 px-5 py-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.30)" }}>#{o.id}</span>
              <span className="flex-1 text-sm text-white">{o.buyer}</span>
              <span className="text-sm font-medium" style={{ color: "#A78BFA" }}>{o.total} сум</span>
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: STATUS_COLORS[o.status] + "22", color: STATUS_COLORS[o.status] }}
              >
                {o.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Добавить товар",    href: "/products",  icon: "➕" },
          { label: "Обработать заказы", href: "/orders",    icon: "📋" },
          { label: "Ответить в чат",    href: "/chat",      icon: "💬" },
        ].map((a) => (
          <a
            key={a.label}
            href={a.href}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white transition-all hover:opacity-80"
            style={glassDim}
          >
            <span className="text-xl">{a.icon}</span>
            {a.label}
          </a>
        ))}
      </div>

    </div>
  );
}
