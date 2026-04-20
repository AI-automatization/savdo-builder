import Link from "next/link";
import Image from "next/image";
import type { ProductListItem } from "types";
import { ProductStatus } from "types";
import { ShoppingBag, Layers } from "lucide-react";

type Props = {
  product: ProductListItem;
  storeSlug: string;
};

export default function ProductCard({ product, storeSlug }: Props) {
  const imageUrl =
    (product as unknown as { images?: Array<{ url: string }> }).images?.[0]?.url
    ?? product.mediaUrls?.[0]
    ?? null;
  const isUnavailable = product.status !== ProductStatus.ACTIVE || !product.isVisible;

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
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
            />
          ) : (
            <ShoppingBag size={20} style={{ color: '#A78BFA' }} />
          )}

          {/* Variants badge */}
          {product.variantCount > 0 && !isUnavailable && (
            <div
              className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                background: "rgba(167,139,250,0.22)",
                color: "#C4B5FD",
                border: "1px solid rgba(167,139,250,0.35)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                zIndex: 1,
              }}
            >
              <Layers size={10} />
              {product.variantCount}
            </div>
          )}

          {/* Out of stock overlay */}
          {isUnavailable && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(13,15,30,0.65)", zIndex: 1 }}
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
          <p className="text-sm font-medium text-white leading-snug line-clamp-2">{product.title}</p>
          <div className="mt-auto">
            <span className="text-sm font-bold" style={{ color: "#A78BFA" }}>
              {Number(product.basePrice).toLocaleString("ru-RU")} сум
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
