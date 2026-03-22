import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductsRepository, CreateProductData } from '../repositories/products.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { Product } from '@prisma/client';

@Injectable()
export class CreateProductUseCase {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async execute(storeId: string, data: Omit<CreateProductData, 'storeId'>): Promise<Product> {
    if (data.basePrice <= 0) {
      throw new DomainException(
        ErrorCode.PRODUCT_PRICE_INVALID,
        'Price must be greater than 0',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.productsRepo.create({ ...data, storeId });
  }
}
