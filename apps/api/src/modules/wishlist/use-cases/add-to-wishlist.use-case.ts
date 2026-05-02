import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { WishlistRepository } from '../repositories/wishlist.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class AddToWishlistUseCase {
  constructor(
    private readonly wishlistRepo: WishlistRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(buyerId: string, productId: string) {
    // Verify product exists and is not deleted
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });

    if (!product) {
      throw new DomainException(
        ErrorCode.PRODUCT_NOT_FOUND,
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.wishlistRepo.create(buyerId, productId);
  }
}
