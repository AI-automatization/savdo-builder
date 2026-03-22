import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class DeleteProductUseCase {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async execute(id: string, storeId: string): Promise<void> {
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

    // INV-P04: Cannot delete ACTIVE product — must archive first
    if (product.status === 'ACTIVE') {
      throw new DomainException(
        ErrorCode.PRODUCT_DELETE_ACTIVE,
        'Cannot delete an active product. Archive it first.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.productsRepo.delete(id);
  }
}
