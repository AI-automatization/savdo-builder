import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import ProductsWithSearch from "@/components/store/ProductsWithSearch";
import CategoryAttributeFilters from "@/components/store/CategoryAttributeFilters";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import {
  serverGetStoreBySlug,
  serverGetProducts,
  serverGetGlobalCategories,
  serverGetCategoryFilters,
} from "@/lib/api/storefront-server";
import { TrackStorefrontView } from "@/components/TrackView";
import { RegisterRecentStore } from "@/components/store/RegisterRecentStore";
import { colors } from "@/lib/styles";
import { Send } from "lucide-react";

// ── SEO ───────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const store = await serverGetStoreBySlug(slug);
    const desc = store.description ?? `Магазин ${store.name} в Telegram. Доставка по ${store.city}.`;
    const ogImage = store.coverUrl ?? store.logoUrl ?? undefined;
    const title = `${store.name} — Savdo`;

    return {
      title,
      description: desc,
      alternates: { canonical: `/${slug}` },
      openGraph: {
        type: 'website',
        siteName: 'Savdo',
        title,
        description: desc,
        url: `/${slug}`,
        locale: 'ru_RU',
        ...(ogImage ? { images: [{ url: ogImage, alt: store.name }] } : {}),
      },
      twitter: {
        card: ogImage ? 'summary_large_image' : 'summary',
        title,
        description: desc,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
    };
  } catch {
    return { title: 'Магазин — Savdo' };
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const categoryId = typeof sp.categoryId === "string" ? sp.categoryId : undefined;
  const gcat = typeof sp.gcat === "string" ? sp.gcat : null;

  const activeAttributes: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (k.startsWith("f.") && typeof v === "string" && v) {
      activeAttributes[k.slice(2)] = v;
    }
  }

  let store;
  try {
    store = await serverGetStoreBySlug(slug);
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e?.status === 404) notFound();
    throw err;
  }

  const [globalCategories, attributeFilters] = await Promise.all([
    serverGetGlobalCategories().catch(() => []),
    gcat ? serverGetCategoryFilters(gcat).catch(() => []) : Promise.resolve([]),
  ]);

  const globalCategoryId = gcat
    ? globalCategories.find((c) => c.slug === gcat)?.id
    : undefined;

  const products = await serverGetProducts({
    storeId: store.id,
    storeCategoryId: categoryId,
    globalCategoryId,
    attributeFilters: Object.keys(activeAttributes).length > 0 ? activeAttributes : undefined,
  });

  // Preserve global category + attribute filter state across storeCategory chip clicks.
  const persistentParams = new URLSearchParams();
  if (gcat) persistentParams.set("gcat", gcat);
  for (const [k, v] of Object.entries(activeAttributes)) {
    persistentParams.append(`f.${k}`, v);
  }
  const buildStoreCategoryHref = (catId: string | null) => {
    const next = new URLSearchParams(persistentParams);
    if (catId) next.set("categoryId", catId);
    const qs = next.toString();
    return qs ? `/${slug}?${qs}` : `/${slug}`;
  };

  return (
    <div className="relative pb-24 md:pb-12">
      <TrackStorefrontView storeId={store.id} storeSlug={slug} />
      <RegisterRecentStore slug={slug} name={store.name} logoUrl={store.logoUrl ?? null} />

      {/* ── Cover hero ─────────────────────────────────────────────────────── */}
      {store.coverUrl ? (
        <div className="relative w-full h-40 sm:h-56 md:h-72 overflow-hidden">
          <Image
            src={store.coverUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(250,250,247,0.85) 90%, " + colors.bg + " 100%)" }} />
        </div>
      ) : (
        <div className="h-4 md:h-8" />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Store header card (overlaps cover when present) ───────────────── */}
        <div
          className={`rounded-2xl overflow-hidden ${store.coverUrl ? "-mt-16 sm:-mt-20" : "mt-2"} relative z-10`}
          style={{ background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: "0 4px 24px rgba(15,17,21,0.06)" }}
        >
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Logo */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 relative overflow-hidden"
              style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
            >
              {store.logoUrl ? (
                <Image src={store.logoUrl} alt={store.name} fill className="object-cover" sizes="80px" />
              ) : (
                store.name.charAt(0)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: colors.textPrimary }}>
                {store.name}
              </h1>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: colors.textMuted }}>
                @{slug} · {store.city}
              </p>
              {store.description && (
                <p className="text-sm leading-relaxed mt-2 line-clamp-2 sm:line-clamp-none" style={{ color: colors.textMuted }}>
                  {store.description}
                </p>
              )}
            </div>

            {store.telegramContactLink && (
              <a
                href={store.telegramContactLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${colors.telegram} 0%, #1d6fa4 100%)`,
                  color: "#FFFFFF",
                  boxShadow: `0 4px 16px rgba(42,171,238,.25)`,
                }}
              >
                <Send size={16} />
                <span className="hidden sm:inline">Написать в Telegram</span>
                <span className="sm:hidden">Telegram</span>
              </a>
            )}
          </div>
        </div>

        {/* ── Store categories chips (sticky on scroll) ─────────────────────── */}
        {store.categories.length > 0 && (
          <div
            className="sticky top-[57px] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 mt-4 mb-4"
            style={{ background: colors.bg, borderBottom: `1px solid ${colors.divider}` }}
          >
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              <Link
                href={buildStoreCategoryHref(null)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={
                  !categoryId
                    ? { background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }
                    : { background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }
                }
              >
                Все
              </Link>
              {store.categories
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((cat) => {
                  const isActive = categoryId === cat.id;
                  return (
                    <Link
                      key={cat.id}
                      href={buildStoreCategoryHref(cat.id)}
                      className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                      style={
                        isActive
                          ? { background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }
                          : { background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }
                      }
                    >
                      {cat.name}
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Two-column layout: filters sidebar (desktop) + product grid ──── */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
          {/* Filters — sidebar on desktop, inline on mobile */}
          <aside className="lg:sticky lg:top-[120px] lg:self-start">
            <CategoryAttributeFilters
              globalCategories={globalCategories}
              activeGlobalSlug={gcat}
              attributeFilters={attributeFilters}
              activeAttributes={activeAttributes}
            />
          </aside>

          {/* Products grid */}
          <main>
            <ProductsWithSearch products={products} storeSlug={slug} />
          </main>
        </div>
      </div>

      <BottomNavBar active="store" storeSlug={slug} />
    </div>
  );
}
