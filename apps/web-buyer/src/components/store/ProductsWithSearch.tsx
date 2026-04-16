"use client";

import { useState, useMemo } from "react";
import type { ProductListItem } from "types";
import ProductCard from "@/components/store/ProductCard";
import { Package, Search } from "lucide-react";

type Props = {
  products: ProductListItem[];
  storeSlug: string;
};

const glassDim = {
  background:           "rgba(255,255,255,0.04)",
  backdropFilter:       "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border:               "1px solid rgba(255,255,255,0.09)",
} as const;

export default function ProductsWithSearch({ products, storeSlug }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, query]);

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <Package size={48} style={{ color: 'rgba(255,255,255,0.3)' }} className="mb-4 mx-auto" />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          Товаров в этой категории пока нет
        </p>
      </div>
    );
  }

  return (
    <>
      {products.length > 8 && (
        <div className="relative mb-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.30)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по товарам..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none"
            style={glassDim}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search size={40} style={{ color: 'rgba(255,255,255,0.3)' }} className="mb-3 mx-auto" />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Ничего не найдено
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      )}
    </>
  );
}
