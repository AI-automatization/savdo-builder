const glass = { background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.13)" } as const;

const ORDERS = [
  { id: "2401", buyer: "Азиз Каримов",    phone: "+998 90 123 45 67", total: "1 200 000", items: 2, status: "pending",   label: "Ожидает",      color: "rgba(251,191,36,.85)" },
  { id: "2400", buyer: "Санжар Рашидов",  phone: "+998 91 234 56 78", total: "890 000",   items: 1, status: "confirmed", label: "Подтверждён",  color: "rgba(96,165,250,.85)" },
  { id: "2399", buyer: "Дилноза Мирзаева",phone: "+998 93 345 67 89", total: "2 100 000", items: 3, status: "shipping",  label: "В пути",       color: "rgba(167,139,250,.90)" },
  { id: "2398", buyer: "Камол Турсунов",  phone: "+998 94 456 78 90", total: "560 000",   items: 1, status: "delivered", label: "Доставлен",    color: "rgba(52,211,153,.85)" },
  { id: "2397", buyer: "Феруза Хасанова", phone: "+998 95 567 89 01", total: "320 000",   items: 2, status: "delivered", label: "Доставлен",    color: "rgba(52,211,153,.85)" },
];

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-white">Заказы</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{ORDERS.length} заказов</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span>#</span><span>Покупатель</span><span>Товаров</span><span>Сумма</span><span>Статус</span>
        </div>
        {ORDERS.map((o) => (
          <div key={o.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 items-center px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.30)" }}>#{o.id}</span>
            <div>
              <p className="text-sm font-medium text-white">{o.buyer}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{o.phone}</p>
            </div>
            <span className="text-sm text-center" style={{ color: "rgba(255,255,255,0.55)" }}>{o.items} шт.</span>
            <span className="text-sm font-medium" style={{ color: "#A78BFA" }}>{o.total} сум</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: o.color + "22", color: o.color }}>
              {o.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
