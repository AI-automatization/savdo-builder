"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PRODUCT = {
  id: "1",
  name: "Air Max 270",
  description:
    "Кроссовки Nike Air Max 270 с большой воздушной подушкой в пятке для максимального комфорта в течение всего дня. Верх из сетки и синтетических материалов обеспечивает лёгкость и вентиляцию.",
  price: 1_450_000,
  salePrice: 1_200_000,
  category: "Обувь",
  inStock: true,
  telegram: "https://t.me/nike_uz",
  images: ["👟", "👟", "👟"],
  sizes: ["39", "40", "41", "42", "43", "44"],
  colors: [
    { name: "Чёрный", hex: "#111111" },
    { name: "Белый", hex: "#f5f5f5" },
    { name: "Синий", hex: "#1d4ed8" },
  ],
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const product = MOCK_PRODUCT;

  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : null;

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Back */}
      <div className="px-4 pt-4">
        <button onClick={() => window.history.length > 1 ? router.back() : router.push(`/${slug}`)} className="btn btn-ghost btn-sm gap-1 -ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад
        </button>
      </div>

      {/* Image carousel */}
      <div className="relative aspect-square bg-base-200 mx-4 mt-2 rounded-2xl overflow-hidden flex items-center justify-center">
        <span className="text-8xl select-none">{product.images[activeImage]}</span>

        {discount !== null && (
          <div className="badge badge-error absolute top-3 left-3 text-sm font-bold px-2 py-3">
            -{discount}%
          </div>
        )}

        {/* Thumbnail dots */}
        {product.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {product.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeImage ? "bg-primary w-4" : "bg-base-content/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail row */}
      <div className="flex gap-2 px-4 mt-2">
        {product.images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImage(i)}
            className={`w-16 h-16 rounded-xl bg-base-200 flex items-center justify-center text-2xl border-2 transition-all ${
              i === activeImage ? "border-primary" : "border-transparent"
            }`}
          >
            {img}
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="px-4 mt-4">
        <p className="text-xs text-base-content/40 uppercase tracking-wide mb-1">{product.category}</p>
        <h1 className="text-xl font-bold leading-snug">{product.name}</h1>

        {/* Price */}
        <div className="flex items-baseline gap-3 mt-2">
          {product.salePrice ? (
            <>
              <span className="text-2xl font-bold text-error">
                {product.salePrice.toLocaleString("ru-RU")} сум
              </span>
              <span className="text-sm text-base-content/40 line-through">
                {product.price.toLocaleString("ru-RU")} сум
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold">
              {product.price.toLocaleString("ru-RU")} сум
            </span>
          )}
        </div>

        {/* Colors */}
        <div className="mt-5">
          <p className="text-sm font-medium mb-2">
            Цвет{selectedColor ? `: ${selectedColor}` : ""}
          </p>
          <div className="flex gap-2">
            {product.colors.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color.name)}
                title={color.name}
                style={{ backgroundColor: color.hex }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color.name
                    ? "border-primary scale-110 shadow-md"
                    : "border-base-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="mt-5">
          <p className="text-sm font-medium mb-2">
            Размер{selectedSize ? `: EU ${selectedSize}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`btn btn-sm min-w-[3rem] ${
                  selectedSize === size ? "btn-primary" : "btn-outline"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mt-5">
          <p className="text-sm font-medium mb-1">Описание</p>
          <p className="text-sm text-base-content/70 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-200 px-4 py-3 flex gap-2 max-w-2xl mx-auto">
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className={`btn flex-1 ${added ? "btn-success" : "btn-primary"}`}
        >
          {added ? "Добавлено ✓" : product.inStock ? "В корзину" : "Нет в наличии"}
        </button>

        <a
          href={product.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="btn gap-2 bg-[#2AABEE] hover:bg-[#229ED9] text-white border-none"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.412 14.6l-2.95-.924c-.642-.204-.657-.642.136-.953l11.526-4.443c.534-.194 1.002.13.438.968z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
