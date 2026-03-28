const glass = { background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.13)" } as const;

const PRODUCTS = [
  { id: "1", name: "Air Max 270",            category: "Обувь",      price: "1 200 000", stock: 12, active: true  },
  { id: "2", name: "Air Force 1 Low",        category: "Обувь",      price: "1 250 000", stock: 8,  active: true  },
  { id: "3", name: "Jordan 1 Retro High OG", category: "Обувь",      price: "2 100 000", stock: 0,  active: false },
  { id: "4", name: "Tech Fleece Hoodie",     category: "Одежда",     price: "890 000",   stock: 5,  active: true  },
  { id: "5", name: "Dri-FIT Running Tee",    category: "Одежда",     price: "259 000",   stock: 20, active: true  },
  { id: "6", name: "Brasilia Backpack 9.5",  category: "Аксессуары", price: "680 000",   stock: 3,  active: true  },
];

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Товары</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{PRODUCTS.length} товаров</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 16px rgba(167,139,250,.35)" }}
        >
          + Добавить товар
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span>Товар</span><span>Категория</span><span>Цена</span><span>Склад</span><span>Статус</span>
        </div>
        {PRODUCTS.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-sm font-medium text-white truncate">{p.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.50)" }}>{p.category}</span>
            <span className="text-sm font-medium" style={{ color: "#A78BFA" }}>{p.price} сум</span>
            <span className="text-sm text-center" style={{ color: p.stock === 0 ? "rgba(239,68,68,.80)" : "rgba(255,255,255,0.60)" }}>{p.stock}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: p.active ? "rgba(52,211,153,.15)" : "rgba(239,68,68,.12)", color: p.active ? "#34d399" : "#f87171" }}>
              {p.active ? "Активен" : "Скрыт"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
