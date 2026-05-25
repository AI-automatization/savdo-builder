import { cache } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import ProductsWithSearch from "@/components/store/ProductsWithSearch";
import CategoryAttributeFilters from "@/components/store/CategoryAttributeFilters";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import {
  serverGetStoreBySlug as rawGetStoreBySlug,
  serverGetProducts,
  serverGetGlobalCategories,
  serverGetCategoryFilters,
} from "@/lib/api/storefront-server";

import { TrackStorefrontView } from "@/components/TrackView";
import { RegisterRecentStore } from "@/components/store/RegisterRecentStore";
import { colors } from "@/lib/styles";
import { StoreHeroBrandColumn } from "@/components/store/StoreHeroBrandColumn";
import { StoreSectionLabels } from "@/components/store/StoreSectionLabels";
import { StoreProductsLabel } from "@/components/store/StoreProductsLabel";
import type { StoreCategoryItem } from "@/components/store/store-types";

// generateMetadata + StorePage both fetch the same store — wrap in React.cache
// so the request runs once per render, not twice.
const serverGetStoreBySlug = cache(rawGetStoreBySlug);

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
    const title = `${store.name} — maxsavdo`;

    return {
      title,
      description: desc,
      alternates: { canonical: `/${slug}` },
      openGraph: {
        type: 'website',
        siteName: 'maxsavdo',
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
    return { title: 'Магазин — maxsavdo' };
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

  const parsePrice = (v: unknown): number | undefined => {
    if (typeof v !== "string" || !v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const priceMin = parsePrice(sp.priceMin);
  const priceMax = parsePrice(sp.priceMax);

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
    priceMin,
    priceMax,
  });

  // Preserve global category + attribute filter state across storeCategory chip clicks.
  const persistentParams = new URLSearchParams();
  if (gcat) persistentParams.set("gcat", gcat);
  if (priceMin != null) persistentParams.set("priceMin", String(priceMin));
  if (priceMax != null) persistentParams.set("priceMax", String(priceMax));
  for (const [k, v] of Object.entries(activeAttributes)) {
    persistentParams.append(`f.${k}`, v);
  }
  const buildStoreCategoryHref = (catId: string | null) => {
    const next = new URLSearchParams(persistentParams);
    if (catId) next.set("categoryId", catId);
    const qs = next.toString();
    return qs ? `/${slug}?${qs}` : `/${slug}`;
  };

  // Pre-compute serializable hrefs — functions cannot cross server→client boundary.
  const allCategoryHref = buildStoreCategoryHref(null);
  const categoryItems: StoreCategoryItem[] = store.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    sortOrder: cat.sortOrder,
    href: buildStoreCategoryHref(cat.id),
  }));

  return (
    <div className="relative pb-24 md:pb-12">
      <TrackStorefrontView storeId={store.id} storeSlug={slug} />
      <RegisterRecentStore slug={slug} name={store.name} logoUrl={store.logoUrl ?? null} />

      {/* ── Hero — split photo + brand-color block ──────────────────────────── */}
      <section className="overflow-hidden">
        <div className="md:grid md:grid-cols-[6fr_4fr]">
          {/* Photo column */}
          <div className="relative h-[200px] md:h-auto md:min-h-[340px] overflow-hidden" style={{ background: colors.surfaceSunken }}>
            {store.coverUrl ? (
              <Image
                src={store.coverUrl}
                alt={store.name}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl font-bold opacity-20" style={{ color: colors.brand }}>
                {store.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Brand-color column — localized via client component */}
          <StoreHeroBrandColumn
            name={store.name}
            city={store.city}
            isVerified={store.isVerified}
            avgRating={store.avgRating ?? null}
            reviewCount={store.reviewCount ?? 0}
            description={store.description}
            telegramContactLink={store.telegramContactLink}
          />
        </div>
      </section>

      {/* ── Content wrapper ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Store categories chip row — localized via client component ──────── */}
        <StoreSectionLabels
          categories={categoryItems}
          activeCategoryId={categoryId}
          allCategoryHref={allCategoryHref}
        />

        {/* ── Products section ───────────────────────────────────────────────── */}
        <section id="products" className="mt-8">
          <div className="flex justify-between items-baseline mb-4">
            <StoreProductsLabel productCount={products.length} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
            <aside className="lg:sticky lg:top-[80px] lg:self-start">
              <CategoryAttributeFilters
                globalCategories={globalCategories}
                activeGlobalSlug={gcat}
                attributeFilters={attributeFilters}
                activeAttributes={activeAttributes}
                priceMin={priceMin ?? null}
                priceMax={priceMax ?? null}
              />
            </aside>
            <main>
              <ProductsWithSearch products={products} storeSlug={slug} />
            </main>
          </div>
        </section>
      </div>

      <BottomNavBar active="store" storeSlug={slug} />
    </div>
  );
}
