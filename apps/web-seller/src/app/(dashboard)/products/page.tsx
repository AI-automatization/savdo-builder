'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSellerProducts, useUpdateProductStatus } from '@/hooks/use-products';
import { Check, Link2, Send } from 'lucide-react';
import { useStore } from '@/hooks/use-seller';
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

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  [ProductStatus.ACTIVE]:         { bg: "rgba(52,211,153,.15)",   color: "#34d399" },
  [ProductStatus.DRAFT]:          { bg: "rgba(251,191,36,.13)",   color: "#fbbf24" },
  [ProductStatus.ARCHIVED]:       { bg: "rgba(255,255,255,.08)",  color: "rgba(255,255,255,0.40)" },
  [ProductStatus.HIDDEN_BY_ADMIN]:{ bg: "rgba(248,113,113,.13)",  color: "#f87171" },
};

const STATUS_FILTERS: { key: ProductStatus | 'ALL'; label: string }[] = [
  { key: 'ALL',                      label: 'Все' },
  { key: ProductStatus.ACTIVE,       label: 'Активные' },
  { key: ProductStatus.DRAFT,        label: 'Черновики' },
  { key: ProductStatus.ARCHIVED,     label: 'Архив' },
];

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

const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? 'savdo_builderBOT';

export default function ProductsPage() {
  const { data: products, isLoading } = useSellerProducts();
  const { mutate: updateStatus, isPending: isStatusPending, variables: statusVars } = useUpdateProductStatus();
  const { data: store } = useStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tgCopiedId, setTgCopiedId] = useState<string | null>(null);

  function copyProductLink(productId: string) {
    if (!store) return;
    const base = process.env.NEXT_PUBLIC_BUYER_URL ?? 'https://savdo.uz';
    const url = `${base}/${store.slug}/products/${productId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(productId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function copyTelegramLink(productId: string) {
    const url = `https://t.me/${BOT_USERNAME}?startapp=product_${productId}`;
    navigator.clipboard.writeText(url).then(() => {
      setTgCopiedId(productId);
      setTimeout(() => setTgCopiedId(null), 2000);
    });
  }
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchSearch = !q || p.title.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [products, search, statusFilter]);

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Товары</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
            {isLoading ? "Загрузка..." : `${products?.length ?? 0} товаров`}
          </p>
        </div>
        <Link
          href="/products/create"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 16px rgba(167,139,250,.35)" }}
        >
          + Добавить
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.30)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full h-9 pl-9 pr-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.11)",
              '--tw-ring-color': 'rgba(167,139,250,0.45)',
            } as React.CSSProperties}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all h-9"
                style={
                  active
                    ? { background: "rgba(167,139,250,0.25)", color: "rgba(167,139,250,1)", border: "1px solid rgba(167,139,250,0.35)" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.10)" }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div
          className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.28)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span>Товар</span>
          <span>Цена</span>
          <span>Статус</span>
          <span></span>
          <span></span>
        </div>

        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
            {products?.length === 0
              ? <><span>Товаров пока нет. </span><Link href="/products/create" style={{ color: "#A78BFA" }}>Добавить первый →</Link></>
              : "Ничего не найдено"}
          </div>
        ) : (
          filtered.map((p) => {
            const sc = STATUS_COLORS[p.status] ?? { bg: "rgba(255,255,255,.08)", color: "rgba(255,255,255,0.45)" };
            const isToggleable = p.status === ProductStatus.ACTIVE || p.status === ProductStatus.DRAFT;
            const isUpdating = isStatusPending && statusVars?.id === p.id;
            const nextStatus = p.status === ProductStatus.ACTIVE ? ProductStatus.DRAFT : ProductStatus.ACTIVE;
            const toggleTitle = p.status === ProductStatus.ACTIVE ? "Перевести в черновик" : "Активировать";

            return (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center px-5 py-3.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-sm font-medium text-white truncate">{p.title}</span>
                <span className="text-sm font-medium" style={{ color: "#A78BFA" }}>
                  {fmt(p.basePrice)}
                </span>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: sc.bg, color: sc.color }}
                >
                  {STATUS_LABELS[p.status] ?? p.status}
                </span>

                {/* Toggle ACTIVE ↔ DRAFT */}
                {isToggleable ? (
                  <button
                    disabled={isUpdating}
                    onClick={() => updateStatus({ id: p.id, status: nextStatus })}
                    className="text-xs font-medium transition-opacity disabled:opacity-40"
                    style={{ color: p.status === ProductStatus.ACTIVE ? "rgba(248,113,113,0.80)" : "rgba(52,211,153,0.80)" }}
                  >
                    {isUpdating ? "..." : p.status === ProductStatus.ACTIVE ? "Скрыть" : "Опубликовать"}
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => copyProductLink(p.id)}
                    title="Скопировать веб-ссылку"
                    className="text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: copiedId === p.id ? "rgba(52,211,153,0.90)" : "rgba(255,255,255,0.30)" }}
                  >
                    {copiedId === p.id ? <Check size={14} /> : <Link2 size={14} />}
                  </button>
                  <button
                    onClick={() => copyTelegramLink(p.id)}
                    title="Скопировать Telegram-ссылку (открывает TMA)"
                    className="text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: tgCopiedId === p.id ? "rgba(52,211,153,0.90)" : "rgba(42,171,238,0.70)" }}
                  >
                    {tgCopiedId === p.id ? <Check size={14} /> : <Send size={14} />}
                  </button>
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: "rgba(167,139,250,0.70)" }}
                  >
                    Изменить
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
