import type { Metadata } from 'next';
import { ProductStatus, type Product } from 'types';
import { API_BASE } from '@/lib/api/env';
import type { ProductReviewsResponse } from '@/lib/api/storefront.api';

const SITE_URL = process.env.NEXT_PUBLIC_BUYER_URL || 'https://shop.maxsavdo.uz';

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/storefront/products/${id}`, {
      next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

/** Reviews API caps limit at 50 server-side — fetch that ceiling in one page. */
async function fetchAllReviews(id: string): Promise<ProductReviewsResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/storefront/products/${id}/reviews?limit=50`, {
      next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ProductReviewsResponse;
  } catch {
    return null;
  }
}

function buildProductJsonLd(
  product: Product,
  slug: string,
  id: string,
  reviews: ProductReviewsResponse | null,
) {
  const price = Number(product.basePrice);
  const images = product.mediaUrls?.length ? product.mediaUrls : undefined;
  const inStock = product.status === ProductStatus.ACTIVE && product.isVisible && product.totalStock > 0;

  // Only claim an aggregateRating when the fetched page covers every review —
  // the API caps `limit` at 50, so a partial sample can't back an accurate average.
  const aggregateRating =
    reviews && reviews.total > 0 && reviews.items.length >= reviews.total
      ? {
          '@type': 'AggregateRating' as const,
          ratingValue: Number(
            (reviews.items.reduce((sum, r) => sum + r.rating, 0) / reviews.items.length).toFixed(2),
          ),
          reviewCount: reviews.total,
        }
      : undefined;

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? undefined,
    image: images,
    sku: id,
    brand: product.store?.name
      ? { '@type': 'Brand', name: product.store.name }
      : undefined,
    aggregateRating,
    // A Product without a valid price can't carry a meaningful Offer — omit
    // rather than advertise price: 0.
    offers: Number.isFinite(price) && price > 0
      ? {
          '@type': 'Offer',
          url: `${SITE_URL}/${slug}/products/${id}`,
          priceCurrency: 'UZS',
          price,
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        }
      : undefined,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const product = await fetchProduct(id);

  if (!product) return { title: 'Товар — maxsavdo' };

  const price = Number(product.basePrice).toLocaleString('ru-RU');
  const desc = product.description?.slice(0, 160) ?? `${price} сум. Купить в Telegram на maxsavdo.`;
  const ogImage = product.mediaUrls?.[0];
  const storeName = product.store?.name;
  const title = storeName ? `${product.title} — ${storeName}` : product.title;

  return {
    title,
    description: desc,
    alternates: { canonical: `/${slug}/products/${id}` },
    openGraph: {
      type: 'website',
      siteName: 'maxsavdo',
      title,
      description: desc,
      url: `/${slug}/products/${id}`,
      locale: 'ru_RU',
      ...(ogImage ? { images: [{ url: ogImage, alt: product.title }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description: desc,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const [product, reviews] = await Promise.all([fetchProduct(id), fetchAllReviews(id)]);
  if (!product) return <>{children}</>;
  const jsonLd = buildProductJsonLd(product, slug, id, reviews);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
