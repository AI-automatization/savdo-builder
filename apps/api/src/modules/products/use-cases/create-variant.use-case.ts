import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { VariantsRepository, CreateVariantData } from '../repositories/variants.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ProductVariant } from '@prisma/client';

@Injectable()
export class CreateVariantUseCase {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
  ) {}

  async execute(
    productId: string,
    storeId: string,
    data: CreateVariantData,
  ): Promise<ProductVariant> {
    const product = await this.productsRepo.findById(productId);

    if (!product) {
      throw new DomainException(
        ErrorCode.PRODUCT_NOT_FOUND,
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (product.storeId !== storeId) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Product does not belong to your store',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.variantsRepo.create(productId, data);
  }
}
