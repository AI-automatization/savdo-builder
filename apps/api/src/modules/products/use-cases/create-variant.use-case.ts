import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { VariantsRepository, CreateVariantData } from '../repositories/variants.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ProductVariant } from '@prisma/client';
import { assertProductOwnership } from '../guards/product-ownership.guard';

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

    assertProductOwnership(product, storeId);

    return this.variantsRepo.create(productId, data);
  }
}
