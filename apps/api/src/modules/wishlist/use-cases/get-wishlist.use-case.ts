import { Injectable } from '@nestjs/common';
import { WishlistRepository } from '../repositories/wishlist.repository';

export interface WishlistItemDto {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    basePrice: number;
    currencyCode: string;
    mediaUrls: string[];
    displayType: string;
    storeId: string;
    storeName: string;
    storeSlug: string;
    isAvailable: boolean;
  };
}

@Injectable()
export class GetWishlistUseCase {
  constructor(private readonly wishlistRepo: WishlistRepository) {}

  async execute(
    buyerId: string,
    resolveImageUrl: (media: unknown) => string,
  ): Promise<WishlistItemDto[]> {
    const items = await this.wishlistRepo.findByBuyerId(buyerId);

    return items.map((item) => {
      const p = item.product;
      const store = p.store;
      const isAvailable =
        p.status === 'ACTIVE' &&
        p.isVisible &&
        store?.status === 'APPROVED' &&
        store?.isPublic === true;

      return {
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt.toISOString(),
        product: {
          id: p.id,
          title: p.title,
          basePrice: Number(p.basePrice),
          currencyCode: p.currencyCode,
          mediaUrls: p.images.map((img) => resolveImageUrl(img.media)).filter(Boolean),
          displayType: p.displayType,
          storeId: p.storeId,
          storeName: store?.name ?? '',
          storeSlug: store?.slug ?? '',
          isAvailable,
        },
      };
    });
  }
}
