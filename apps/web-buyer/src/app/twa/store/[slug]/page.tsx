"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://savdo-api-production.up.railway.app";

interface Product {
  id: string;
  title: string;
  description: string | null;
  basePrice: number;
  status: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const glass = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
} as const;

export default function TwaStorePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/v1/storefront/stores/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) {
          setStore(data.data.store ?? data.data);
          setProducts(data.data.products ?? []);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingScreen />;

  if (error || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
        style={{ background: "linear-gradient(135deg, #0f0a1e, #1a0f2e)" }}>
        <span style={{ fontSize: 40 }}>😕</span>
        <p style={{ color: "rgba(255,255,255,0.60)", fontSize: 14 }}>Магазин не найден</p>
        <button onClick={() => router.back()} style={{ color: "#A78BFA", fontSize: 14 }}>← Назад</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0a1628 100%)" }}>
      {/* Ambient */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 400, height: 400, top: -150, right: -100, background: "radial-gradient(circle, rgba(167,139,250,.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-4 pt-5 pb-8 gap-4">

        {/* Назад */}
        <button onClick={() => router.back()} className="flex items-center gap-1.5 w-fit" style={{ color: "rgba(255,255,255,0.50)", fontSize: 13 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Назад
        </button>

        {/* Шапка магазина */}
        <div className="flex items-center gap-3" style={glass}>
          <div className="p-4 w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "rgba(167,139,250,0.20)", border: "1px solid rgba(167,139,250,0.25)" }}>
                🏪
              </div>
              <div>
                <h1 className="text-base font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>{store.name}</h1>
                <p className="text-[11px]" style={{ color: "rgba(167,139,250,0.80)" }}>savdo.uz/{store.slug}</p>
              </div>
            </div>
            {store.description && (
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>{store.description}</p>
            )}
          </div>
        </div>

        {/* Товары */}
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
          Товары ({products.length})
        </h2>

        {!products.length && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>📭</span>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Товаров пока нет</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} storeSlug={store.slug} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, storeSlug }: { product: Product; storeSlug: string }) {
  const router = useRouter();
  const buyerUrl = process.env.NEXT_PUBLIC_BUYER_URL ?? "https://savdo.uz";

  return (
    <button
      onClick={() => router.push(`${buyerUrl}/${storeSlug}/products/${product.id}`)}
      className="text-left flex flex-col gap-2 p-3 active:opacity-70 transition-opacity"
      style={glass}
    >
      <div className="w-full aspect-square rounded-xl flex items-center justify-center text-3xl"
        style={{ background: "rgba(255,255,255,0.04)" }}>
        📦
      </div>
      <p className="text-xs font-semibold leading-tight" style={{ color: "rgba(255,255,255,0.88)" }}>
        {product.title}
      </p>
      <p className="text-xs font-bold" style={{ color: "#A78BFA" }}>
        {Number(product.basePrice).toLocaleString("ru")} сум
      </p>
    </button>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f0a1e, #1a0f2e)" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(167,139,250,0.30)", borderTopColor: "#A78BFA" }} />
    </div>
  );
}
