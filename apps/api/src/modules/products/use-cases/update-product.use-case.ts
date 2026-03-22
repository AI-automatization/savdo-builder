import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductsRepository, UpdateProductData } from '../repositories/products.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { Product } from '@prisma/client';

@Injectable()
export class UpdateProductUseCase {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async execute(id: string, storeId: string, data: UpdateProductData): Promise<Product> {
    const product = await this.productsRepo.findById(id);

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

    if (data.basePrice !== undefined && data.basePrice <= 0) {
      throw new DomainException(
        ErrorCode.PRODUCT_PRICE_INVALID,
        'Price must be greater than 0',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.productsRepo.update(id, data);
  }
}
