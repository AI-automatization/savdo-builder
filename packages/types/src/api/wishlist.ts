// Wishlist (favorite products) for buyers.
// Endpoints:
//   GET    /api/v1/buyer/wishlist            → WishlistItem[]
//   POST   /api/v1/buyer/wishlist            body: { productId } → WishlistItem
//   DELETE /api/v1/buyer/wishlist/:productId → 204

import type { ProductListItem } from './products';

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  /** Embedded product preview (always included for list responses). */
  product: Pick<
    ProductListItem,
    'id' | 'title' | 'basePrice' | 'currencyCode' | 'mediaUrls' | 'displayType'
  > & {
    storeId: string;
    storeName: string;
    storeSlug: string;
    isAvailable: boolean;
  };
}
