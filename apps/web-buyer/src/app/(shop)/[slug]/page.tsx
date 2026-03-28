import Link from "next/link";
import ProductCard, { type Product } from "@/components/store/ProductCard";

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_STORE = {
  name: "Nike Uzbekistan",
  description: "Официальный магазин Nike. Оригинальная спортивная одежда и обувь с доставкой по Ташкенту.",
  telegram: "https://t.me/nike_uz",
  categories: ["Все", "Обувь", "Одежда", "Аксессуары"],
};

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Air Max 270",             price: 1_450_000, salePrice: 1_200_000, category: "Обувь",      inStock: true  },
  { id: "2", name: "Air Force 1 Low",         price: 1_250_000,                       category: "Обувь",      inStock: true  },
  { id: "3", name: "Jordan 1 Retro High OG",  price: 2_100_000,                       category: "Обувь",      inStock: true  },
  { id: "4", name: "React Infinity Run FK 3", price: 1_650_000,                       category: "Обувь",      inStock: false },
  { id: "5", name: "Tech Fleece Hoodie",      price:   890_000,                       category: "Одежда",     inStock: true  },
  { id: "6", name: "Dri-FIT Running Tee",     price:   320_000, salePrice:   259_000, category: "Одежда",     inStock: true  },
  { id: "7", name: "Club Fleece Joggers",     price:   560_000, salePrice:   420_000, category: "Одежда",     inStock: true  },
  { id: "8", name: "Nike Cap Classic 99",     price:   185_000,                       category: "Аксессуары", inStock: true  },
  { id: "9", name: "Brasilia Backpack 9.5",   price:   680_000,                       category: "Аксессуары", inStock: true  },
];

// ── Glass tokens ──────────────────────────────────────────────────────────────

const glass = {
  background:           "rgba(255,255,255,0.08)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border:               "1px solid rgba(255,255,255,0.15)",
} as const;

const glassDim = {
  background:           "rgba(255,255,255,0.04)",
  backdropFilter:       "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border:               "1px solid rgba(255,255,255,0.09)",
} as const;

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug }     = await params;
  const { category } = await searchParams;

  const activeCategory = category ?? "Все";
  const products = activeCategory === "Все"
    ? MOCK_PRODUCTS
    : MOCK_PRODUCTS.filter((p) => p.category === activeCategory);

  const NAV = [
    { href: `/${slug}`,    label: "Магазин", icon: <IcoShop />,    active: true },
    { href: "/cart",       label: "Корзина", icon: <IcoCart /> },
    { href: "/chats",      label: "Чаты",    icon: <IcoChat /> },
    { href: "/orders",     label: "Заказы",  icon: <IcoOrders /> },
    { href: "/profile",    label: "Профиль", icon: <IcoProfile /> },
  ];

  return (
    <div className="relative min-h-screen">

      {/* ── Ambient glow orbs ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 400, height: 400, top: -120, right: -100, background: "radial-gradient(circle, rgba(167,139,250,.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute rounded-full" style={{ width: 320, height: 320, bottom: 160, left: -80,  background: "radial-gradient(circle, rgba(34,197,94,.12)  0%, transparent 70%)", filter: "blur(32px)" }} />
        <div className="absolute rounded-full" style={{ width: 240, height: 240, top: "40%", left: "50%", transform: "translateX(-50%)", background: "radial-gradient(circle, rgba(96,165,250,.09) 0%, transparent 70%)", filter: "blur(28px)" }} />
      </div>

      {/* ── Scrollable content ── */}
      <div className="relative max-w-md mx-auto px-4 pt-5 pb-32" style={{ zIndex: 1 }}>

        {/* ── Store header ── */}
        <div className="rounded-2xl p-4 mb-4" style={glass}>
          {/* Avatar + name row */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{ background: "rgba(167,139,250,.28)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.4)" }}
            >
              {MOCK_STORE.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white leading-tight">{MOCK_STORE.name}</h1>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>@{slug}</p>
            </div>
            {/* Cart shortcut */}
            <Link
              href="/cart"
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ ...glassDim, color: "rgba(255,255,255,0.55)" }}
            >
              <IcoCart />
            </Link>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
            {MOCK_STORE.description}
          </p>

          {/* Telegram CTA */}
          <a
            href={MOCK_STORE.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: "linear-gradient(135deg, #1d6fa4 0%, #2AABEE 100%)", boxShadow: "0 4px 16px rgba(42,171,238,.25)" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
            </svg>
            Написать в Telegram
          </a>
        </div>

        {/* ── Category filter ── */}
        <div
          className="sticky flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none"
          style={{ top: "12px", zIndex: 10 }}
        >
          {MOCK_STORE.categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Link
                key={cat}
                href={cat === "Все" ? `/${slug}` : `/${slug}?category=${encodeURIComponent(cat)}`}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={
                  isActive
                    ? { background: "rgba(167,139,250,.28)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.45)" }
                    : { ...glassDim, color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.10)" }
                }
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* ── Product grid ── */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Товаров в этой категории пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} storeSlug={slug} />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom navigation ── */}
      <div className="fixed bottom-0 left-0 right-0" style={{ zIndex: 50 }}>
        <div
          className="max-w-md mx-auto"
          style={{ ...glassDim, borderRadius: "20px 20px 0 0", borderBottom: "none" }}
        >
          <nav className="flex items-center justify-around px-2 py-2">
            {NAV.map(({ href, label, icon, active }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-[3px] px-3 py-1 rounded-xl"
              >
                <span style={{ color: active ? "#A78BFA" : "rgba(255,255,255,0.32)" }}>{icon}</span>
                <span className="text-[10px] font-medium" style={{ color: active ? "#A78BFA" : "rgba(255,255,255,0.28)" }}>
                  {label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

    </div>
  );
}
