import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { Product, ProductStatus } from '@prisma/client';

// Valid transitions per docs/V1.1/02_state_machines.md
// DRAFT → ACTIVE, ACTIVE → ARCHIVED, ACTIVE → DRAFT, ARCHIVED → ACTIVE
// HIDDEN_BY_ADMIN — only admin can change, blocked here entirely
const ALLOWED_TRANSITIONS: Record<string, ProductStatus[]> = {
  DRAFT: [ProductStatus.ACTIVE],
  ACTIVE: [ProductStatus.ARCHIVED, ProductStatus.DRAFT],
  ARCHIVED: [ProductStatus.ACTIVE],
};

@Injectable()
export class ChangeProductStatusUseCase {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async execute(id: string, storeId: string, newStatus: ProductStatus): Promise<Product> {
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

    if (product.status === ProductStatus.HIDDEN_BY_ADMIN) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Product is hidden by admin and cannot be changed by seller',
        HttpStatus.FORBIDDEN,
      );
    }

    const allowed = ALLOWED_TRANSITIONS[product.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new DomainException(
        ErrorCode.PRODUCT_INVALID_TRANSITION,
        `Cannot transition product from ${product.status} to ${newStatus}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.productsRepo.updateStatus(id, newStatus);
  }
}
