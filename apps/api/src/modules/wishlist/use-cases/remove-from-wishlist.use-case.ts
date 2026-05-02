import { Injectable } from '@nestjs/common';
import { WishlistRepository } from '../repositories/wishlist.repository';

@Injectable()
export class RemoveFromWishlistUseCase {
  constructor(private readonly wishlistRepo: WishlistRepository) {}

  async execute(buyerId: string, productId: string): Promise<void> {
    await this.wishlistRepo.delete(buyerId, productId);
  }
}
