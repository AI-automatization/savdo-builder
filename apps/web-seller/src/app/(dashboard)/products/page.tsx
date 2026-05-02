'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSellerProducts, useUpdateProductStatus } from '@/hooks/use-products';
import { Check, Link2, Send, Layers, Package } from 'lucide-react';
import { useStore } from '@/hooks/use-seller';
import { ProductStatus } from 'types';
import { card, colors, inputStyle } from '@/lib/styles';

const STATUS_LABELS: Record<string, string> = {
  [ProductStatus.ACTIVE]:         "Активен",
  [ProductStatus.DRAFT]:          "Черновик",
  [ProductStatus.ARCHIVED]:       "Архив",
  [ProductStatus.HIDDEN_BY_ADMIN]:"Скрыт",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  [ProductStatus.ACTIVE]:         { bg: "rgba(52,211,153,.15)",   color: colors.success },
  [ProductStatus.DRAFT]:          { bg: "rgba(251,191,36,.13)",   color: colors.warning },
  [ProductStatus.ARCHIVED]:       { bg: colors.surfaceElevated,   color: colors.textDim },
  [ProductStatus.HIDDEN_BY_ADMIN]:{ bg: "rgba(248,113,113,.13)",  color: colors.danger },
};

const STATUS_FILTERS: { key: ProductStatus | 'ALL'; label: string }[] = [
  { key: 'ALL',                      label: 'Все' },
  { key: ProductStatus.ACTIVE,       label: 'Активные' },
  { key: ProductStatus.DRAFT,        label: 'Черновики' },
  { key: ProductStatus.ARCHIVED,     label: 'Архив' },
];

function fmt(n: unknown) {
  const num = typeof n === "number" ? n : Number(n);
  return (Number.isFinite(num) ? num : 0).toLocaleString('ru-RU') + ' сум';
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: colors.surfaceElevated }}
    />
  );
}

const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? 'savdo_builderBOT';

export default function ProductsPage() {
  const { data: productsData, isLoading } = useSellerProducts();
  const products = productsData?.products;
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
          <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Товары</h1>
          <p className="text-sm mt-0.5" style={{ color: colors.textDim }}>
            {isLoading ? "Загрузка..." : `${products?.length ?? 0} товаров`}
          </p>
        </div>
        <Link
          href="/products/create"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shrink-0 transition-opacity hover:opacity-90"
          style={{ background: colors.accent, color: colors.bg }}
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
            style={{ color: colors.textDim }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{
              ...inputStyle,
              '--tw-ring-color': colors.accentBorder,
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
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors h-9"
                style={
                  active
                    ? { background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }
                    : { background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={card}>
        {/* Header row — desktop only */}
        <div
          className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: colors.textDim, borderBottom: `1px solid ${colors.divider}`, background: colors.surfaceMuted }}
        >
          <span></span>
          <span>Товар</span>
          <span>Цена</span>
          <span>Статус</span>
          <span></span>
          <span></span>
        </div>

        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 px-4 py-3.5 sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] sm:gap-x-4 sm:items-center sm:px-5"
                style={{ borderBottom: `1px solid ${colors.divider}` }}
              >
                <Skeleton className="hidden sm:block w-11 h-11 rounded-md" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm" style={{ color: colors.textDim }}>
            {products?.length === 0
              ? <><span>Товаров пока нет. </span><Link href="/products/create" style={{ color: colors.accent }}>Добавить первый →</Link></>
              : "Ничего не найдено"}
          </div>
        ) : (
          filtered.map((p) => {
            const sc = STATUS_COLORS[p.status] ?? { bg: colors.surfaceElevated, color: colors.textMuted };
            const isToggleable = p.status === ProductStatus.ACTIVE || p.status === ProductStatus.DRAFT;
            const isUpdating = isStatusPending && statusVars?.id === p.id;
            const nextStatus = p.status === ProductStatus.ACTIVE ? ProductStatus.DRAFT : ProductStatus.ACTIVE;
            const thumb = p.mediaUrls?.[0] ?? null;

            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] sm:gap-x-4 sm:gap-y-0 sm:items-center sm:px-5 transition-colors"
                style={{ borderBottom: `1px solid ${colors.divider}` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceElevated; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Mobile top row: thumb + title/variants + status */}
                <div className="flex items-start gap-3 sm:hidden">
                  <div
                    className="shrink-0 w-12 h-12 rounded-md overflow-hidden flex items-center justify-center"
                    style={{ background: colors.surfaceSunken, border: `1px solid ${colors.border}` }}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={18} strokeWidth={1.6} style={{ color: colors.textDim }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{p.title}</p>
                        {p.variantCount > 0 && (
                          <span
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                            style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
                            title={`${p.variantCount} активных вариантов`}
                          >
                            <Layers size={10} />
                            {p.variantCount}
                          </span>
                        )}
                      </div>
                      <span
                        className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-1" style={{ color: colors.accent }}>
                      {fmt(p.basePrice)}
                    </p>
                  </div>
                </div>

                {/* Mobile bottom row: actions */}
                <div className="flex items-center gap-3 sm:hidden">
                  {isToggleable && (
                    <button
                      disabled={isUpdating}
                      onClick={() => updateStatus({ id: p.id, status: nextStatus })}
                      className="text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ color: p.status === ProductStatus.ACTIVE ? colors.danger : colors.success }}
                    >
                      {isUpdating ? "..." : p.status === ProductStatus.ACTIVE ? "Скрыть" : "Опубликовать"}
                    </button>
                  )}
                  <button
                    onClick={() => copyProductLink(p.id)}
                    aria-label="Скопировать веб-ссылку"
                    className="p-1.5 -m-1.5 transition-opacity hover:opacity-80"
                    style={{ color: copiedId === p.id ? colors.success : colors.textDim }}
                  >
                    {copiedId === p.id ? <Check size={16} /> : <Link2 size={16} />}
                  </button>
                  <button
                    onClick={() => copyTelegramLink(p.id)}
                    aria-label="Скопировать Telegram-ссылку"
                    className="p-1.5 -m-1.5 transition-opacity hover:opacity-80"
                    style={{ color: tgCopiedId === p.id ? colors.success : "#60A5FA" }}
                  >
                    {tgCopiedId === p.id ? <Check size={16} /> : <Send size={16} />}
                  </button>
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-md transition-opacity hover:opacity-90"
                    style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
                  >
                    Изменить
                  </Link>
                </div>

                {/* Desktop: thumbnail */}
                <div
                  className="hidden sm:flex shrink-0 w-11 h-11 rounded-md overflow-hidden items-center justify-center"
                  style={{ background: colors.surfaceSunken, border: `1px solid ${colors.border}` }}
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={18} strokeWidth={1.6} style={{ color: colors.textDim }} />
                  )}
                </div>

                {/* Desktop: title + variants */}
                <div className="hidden sm:flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{p.title}</span>
                  {p.variantCount > 0 && (
                    <span
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                      style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
                      title={`${p.variantCount} активных вариантов`}
                    >
                      <Layers size={10} />
                      {p.variantCount}
                    </span>
                  )}
                </div>

                {/* Desktop: price */}
                <span className="hidden sm:inline text-sm font-medium" style={{ color: colors.accent }}>
                  {fmt(p.basePrice)}
                </span>

                {/* Desktop: status */}
                <span
                  className="hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: sc.bg, color: sc.color }}
                >
                  {STATUS_LABELS[p.status] ?? p.status}
                </span>

                {/* Desktop: toggle */}
                {isToggleable ? (
                  <button
                    disabled={isUpdating}
                    onClick={() => updateStatus({ id: p.id, status: nextStatus })}
                    className="hidden sm:inline text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ color: p.status === ProductStatus.ACTIVE ? colors.danger : colors.success }}
                  >
                    {isUpdating ? "..." : p.status === ProductStatus.ACTIVE ? "Скрыть" : "Опубликовать"}
                  </button>
                ) : (
                  <span className="hidden sm:inline" />
                )}

                {/* Desktop: actions */}
                <div className="hidden sm:flex items-center gap-2.5">
                  <button
                    onClick={() => copyProductLink(p.id)}
                    title="Скопировать веб-ссылку"
                    className="text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: copiedId === p.id ? colors.success : colors.textDim }}
                  >
                    {copiedId === p.id ? <Check size={14} /> : <Link2 size={14} />}
                  </button>
                  <button
                    onClick={() => copyTelegramLink(p.id)}
                    title="Скопировать Telegram-ссылку (открывает TMA)"
                    className="text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: tgCopiedId === p.id ? colors.success : "#60A5FA" }}
                  >
                    {tgCopiedId === p.id ? <Check size={14} /> : <Send size={14} />}
                  </button>
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: colors.accent }}
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
