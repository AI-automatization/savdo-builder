import Link from "next/link";
import ProductCard, { type Product } from "@/components/store/ProductCard";

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STORE = {
  name: "Nike Uzbekistan",
  description:
    "Официальный магазин Nike. Оригинальная спортивная одежда и обувь с доставкой по Ташкенту.",
  telegram: "https://t.me/nike_uz",
  categories: ["Все", "Обувь", "Одежда", "Аксессуары"],
};

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Air Max 270", price: 1_450_000, salePrice: 1_200_000, category: "Обувь", inStock: true },
  { id: "2", name: "Air Force 1 Low", price: 1_250_000, category: "Обувь", inStock: true },
  { id: "3", name: "Jordan 1 Retro High OG", price: 2_100_000, category: "Обувь", inStock: true },
  { id: "4", name: "React Infinity Run FK 3", price: 1_650_000, category: "Обувь", inStock: false },
  { id: "5", name: "Tech Fleece Hoodie", price: 890_000, category: "Одежда", inStock: true },
  { id: "6", name: "Dri-FIT Running Tee", price: 320_000, salePrice: 259_000, category: "Одежда", inStock: true },
  { id: "7", name: "Club Fleece Joggers", price: 560_000, salePrice: 420_000, category: "Одежда", inStock: true },
  { id: "8", name: "Nike Cap Classic 99", price: 185_000, category: "Аксессуары", inStock: true },
  { id: "9", name: "Brasilia Backpack 9.5", price: 680_000, category: "Аксессуары", inStock: true },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const { category } = await searchParams;

  const activeCategory = category ?? "Все";

  const products =
    activeCategory === "Все"
      ? MOCK_PRODUCTS
      : MOCK_PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <div className="pb-12">
      {/* Store header */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-3">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-16 h-16 text-2xl font-bold flex items-center justify-center">
                {MOCK_STORE.name.charAt(0)}
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">{MOCK_STORE.name}</h1>
              <p className="text-xs text-base-content/50 mt-0.5">@{slug}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-base-content/70 mb-4 leading-relaxed">
            {MOCK_STORE.description}
          </p>

          {/* Telegram CTA */}
          <a
            href={MOCK_STORE.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm gap-2 bg-[#2AABEE] hover:bg-[#229ED9] text-white border-none"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.412 14.6l-2.95-.924c-.642-.204-.657-.642.136-.953l11.526-4.443c.534-.194 1.002.13.438.968z" />
            </svg>
            Написать в Telegram
          </a>
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-[64px] z-40 bg-base-100 border-b border-base-200">
        <div className="max-w-2xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none">
          {MOCK_STORE.categories.map((cat) => (
            <Link
              key={cat}
              href={cat === "Все" ? `/${slug}` : `/${slug}?category=${encodeURIComponent(cat)}`}
              className={`btn btn-sm flex-shrink-0 ${
                activeCategory === cat
                  ? "btn-primary"
                  : "btn-ghost border border-base-300"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {products.length === 0 ? (
          <div className="text-center py-16 text-base-content/40">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm">Товаров в этой категории пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} storeSlug={slug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
