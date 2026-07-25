import { serverGetProduct, serverGetProductReviews } from "@/lib/api/storefront-server";
import ProductPageClient from "./ProductPageClient";

// SEO-AUDIT-001 п.4: server-фетч продукта, чтобы краулер (в т.ч. AI-боты
// без JS) видел реальный контент товара в первом HTML, а не пустую
// "use client" страницу. Интерактив (галерея/варианты/корзина) остаётся
// в ProductPageClient — initialProduct прокидывается в useProduct как
// initialData (stale сразу, клиент доуточняет auth-зависимые поля).
//
// SEO-GEO-AEO-RESEARCH-002 п.4: то же самое для первой страницы отзывов —
// текст отзывов (не только рейтинг) должен быть в первом HTML, иначе
// aggregateRating в Product JSON-LD (layout.tsx) не подкреплён видимым
// контентом для краулеров без JS.
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;
  const [initialProduct, initialReviews] = await Promise.all([
    serverGetProduct(id).catch(() => undefined),
    serverGetProductReviews(id).catch(() => undefined),
  ]);

  return <ProductPageClient initialProduct={initialProduct} initialReviews={initialReviews} />;
}
