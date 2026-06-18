import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { VariantsRepository } from '../repositories/variants.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ProductVariant } from '@prisma/client';
import { assertProductOwnership } from '../guards/product-ownership.guard';

@Injectable()
export class AdjustStockUseCase {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
  ) {}

  async execute(
    variantId: string,
    productId: string,
    storeId: string,
    delta: number,
    reason: string,
    orderId?: string,
  ): Promise<ProductVariant> {
    const product = await this.productsRepo.findById(productId);

    if (!product) {
      throw new DomainException(
        ErrorCode.PRODUCT_NOT_FOUND,
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }

    assertProductOwnership(product, storeId);

    const variant = await this.variantsRepo.findById(variantId);

    if (!variant) {
      throw new DomainException(
        ErrorCode.VARIANT_NOT_FOUND,
        'Variant not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (variant.productId !== productId) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Variant does not belong to this product',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.variantsRepo.adjustStock(variantId, delta, reason, orderId);
  }
}
