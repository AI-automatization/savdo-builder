import Link from "next/link";

export type Product = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  category: string;
  inStock: boolean;
};

type Props = {
  product: Product;
  storeSlug: string;
};

export default function ProductCard({ product, storeSlug }: Props) {
  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : null;

  return (
    <Link href={`/${storeSlug}/products/${product.id}`} className="block">
      <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow h-full">
        <figure className="aspect-square bg-base-200 relative overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-base-content/20 select-none">
            🛍
          </div>
          {discount !== null && (
            <div className="badge badge-error absolute top-2 left-2 font-semibold">
              -{discount}%
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-base-100/75 flex items-center justify-center">
              <span className="badge badge-neutral badge-lg">Нет в наличии</span>
            </div>
          )}
        </figure>

        <div className="card-body p-3 gap-1">
          <h3 className="text-sm font-medium leading-snug line-clamp-2">
            {product.name}
          </h3>

          <div className="flex flex-col mt-1">
            {product.salePrice ? (
              <>
                <span className="font-bold text-error text-base">
                  {product.salePrice.toLocaleString("ru-RU")} сум
                </span>
                <span className="text-xs text-base-content/40 line-through">
                  {product.price.toLocaleString("ru-RU")} сум
                </span>
              </>
            ) : (
              <span className="font-bold text-base">
                {product.price.toLocaleString("ru-RU")} сум
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
