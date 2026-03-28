import Link from "next/link";

export type Product = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  category: string;
  inStock: boolean;
};

type Props = {
  product: Product;
  storeSlug: string;
};

const CATEGORY_EMOJI: Record<string, string> = {
  "Обувь":      "👟",
  "Одежда":     "🧥",
  "Аксессуары": "🎒",
};

export default function ProductCard({ product, storeSlug }: Props) {
  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : null;
  const displayPrice = product.salePrice ?? product.price;
  const emoji = CATEGORY_EMOJI[product.category] ?? "🛍";

  return (
    <Link href={`/${storeSlug}/products/${product.id}`} className="block">
      <div
        className="rounded-2xl overflow-hidden transition-transform active:scale-[0.97] h-full flex flex-col"
        style={{
          background:           "rgba(255,255,255,0.08)",
          backdropFilter:       "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border:               "1px solid rgba(255,255,255,0.14)",
        }}
      >
        {/* Image area */}
        <div
          className="aspect-square relative flex items-center justify-center text-5xl select-none"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {emoji}

          {/* Discount badge */}
          {discount !== null && (
            <span
              className="absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(239,68,68,.85)", color: "#fff" }}
            >
              -{discount}%
            </span>
          )}

          {/* Out of stock overlay */}
          {!product.inStock && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(13,15,30,0.65)" }}
            >
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                Нет в наличии
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <p className="text-sm font-medium text-white leading-snug line-clamp-2">{product.name}</p>

          <div className="flex flex-col mt-auto">
            <span className="text-sm font-bold" style={{ color: "#A78BFA" }}>
              {displayPrice.toLocaleString("ru-RU")} сум
            </span>
            {product.salePrice && (
              <span className="text-[11px] line-through" style={{ color: "rgba(255,255,255,0.30)" }}>
                {product.price.toLocaleString("ru-RU")} сум
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
