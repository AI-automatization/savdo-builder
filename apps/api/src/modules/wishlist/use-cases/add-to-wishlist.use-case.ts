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
    // Verify product exists and is not deleted.
    // MARKETING-WISHLIST-NOTIFY-001: подтягиваем priceSnapshot +
    // inStockSnapshot для cron-сканера (детекция price-drop / back-in-stock).
    // Stock хранится на ProductVariant, поэтому in-stock = status=ACTIVE +
    // isVisible (достаточный сигнал «можно купить») плюс хоть один
    // variant с stockQuantity>0 ИЛИ нет вариантов (single-stock product).
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: {
        id: true,
        basePrice: true,
        salePrice: true,
        status: true,
        isVisible: true,
        variants: {
          where: { isActive: true },
          select: { stockQuantity: true },
        },
      },
    });

    if (!product) {
      throw new DomainException(
        ErrorCode.PRODUCT_NOT_FOUND,
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const priceSnapshot = product.salePrice ?? product.basePrice;
    const hasVariants = product.variants.length > 0;
    const anyVariantInStock = hasVariants && product.variants.some((v) => v.stockQuantity > 0);
    const inStockSnapshot =
      product.status === 'ACTIVE' &&
      product.isVisible &&
      (!hasVariants || anyVariantInStock);

    return this.wishlistRepo.create(buyerId, productId, {
      priceSnapshot,
      inStockSnapshot,
    });
  }
}
