import type { Metadata } from 'next';
import type { Product } from 'types';

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${BASE}/storefront/products/${id}`, {
      next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const product = await fetchProduct(id);

  if (!product) return { title: 'Товар — Savdo' };

  const price = Number(product.basePrice).toLocaleString('ru-RU');
  const desc = product.description?.slice(0, 160) ?? `${price} сум. Купить в Telegram на Savdo.`;
  const ogImage = product.mediaUrls?.[0];
  const storeName = product.store?.name;
  const title = storeName ? `${product.title} — ${storeName}` : product.title;

  return {
    title,
    description: desc,
    alternates: { canonical: `/${slug}/products/${id}` },
    openGraph: {
      type: 'website',
      siteName: 'Savdo',
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

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
