import { serverGetProduct } from "@/lib/api/storefront-server";
import ProductPageClient from "./ProductPageClient";

// SEO-AUDIT-001 п.4: server-фетч продукта, чтобы краулер (в т.ч. AI-боты
// без JS) видел реальный контент товара в первом HTML, а не пустую
// "use client" страницу. Интерактив (галерея/варианты/корзина) остаётся
// в ProductPageClient — initialProduct прокидывается в useProduct как
// initialData (stale сразу, клиент доуточняет auth-зависимые поля).
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;
  const initialProduct = await serverGetProduct(id).catch(() => undefined);

  return <ProductPageClient initialProduct={initialProduct} />;
}
