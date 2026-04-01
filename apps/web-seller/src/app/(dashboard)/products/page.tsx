'use client';

import { useSellerProducts } from '../../../hooks/use-products';
import { ProductStatus } from 'types';

const glass = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.13)",
} as const;

const STATUS_LABELS: Record<string, string> = {
  [ProductStatus.ACTIVE]:         "Активен",
  [ProductStatus.DRAFT]:          "Черновик",
  [ProductStatus.ARCHIVED]:       "Архив",
  [ProductStatus.HIDDEN_BY_ADMIN]:"Скрыт",
};

function fmt(n: number) {
  return n.toLocaleString('ru-RU') + ' сум';
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: "rgba(255,255,255,0.10)" }}
    />
  );
}

export default function ProductsPage() {
  const { data: products, isLoading } = useSellerProducts();

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Товары</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
            {isLoading ? "Загрузка..." : `${products?.length ?? 0} товаров`}
          </p>
        </div>
        <a
          href="/products/create"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 16px rgba(167,139,250,.35)" }}
        >
          + Добавить товар
        </a>
      </div>

      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div
          className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.28)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span>Товар</span>
          <span>Цена</span>
          <span>Статус</span>
        </div>

        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </>
        ) : !products || products.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
            Товаров пока нет.{" "}
            <a href="/products/create" style={{ color: "#A78BFA" }}>Добавить первый →</a>
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-5 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-sm font-medium text-white truncate">{p.title}</span>
              <span className="text-sm font-medium" style={{ color: "#A78BFA" }}>
                {fmt(p.basePrice)}
              </span>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: p.status === ProductStatus.ACTIVE
                    ? "rgba(52,211,153,.15)"
                    : "rgba(255,255,255,.08)",
                  color: p.status === ProductStatus.ACTIVE
                    ? "#34d399"
                    : "rgba(255,255,255,0.45)",
                }}
              >
                {STATUS_LABELS[p.status] ?? p.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
