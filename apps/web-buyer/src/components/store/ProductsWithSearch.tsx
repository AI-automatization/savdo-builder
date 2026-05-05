"use client";

import { useState, useMemo } from "react";
import type { ProductListItem } from "types";
import ProductCard from "@/components/store/ProductCard";
import { Package, Search } from "lucide-react";
import { colors } from "@/lib/styles";

type Props = {
  products: ProductListItem[];
  storeSlug: string;
};

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
        <Package size={48} style={{ color: colors.textDim }} className="mb-4 mx-auto" />
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Товаров в этой категории пока нет
        </p>
      </div>
    );
  }

  return (
    <>
      {products.length > 8 && (
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: colors.textDim }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по товарам..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              color: colors.textBody,
              ['--tw-ring-color' as string]: colors.brandBorder,
            }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search size={40} style={{ color: colors.textDim }} className="mb-3 mx-auto" />
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Ничего не найдено
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3.5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      )}
    </>
  );
}
