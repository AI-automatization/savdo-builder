import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { ChangeProductStatusUseCase } from '../../products/use-cases/change-product-status.use-case';
import { assertProductOwnership } from '../../products/guards/product-ownership.guard';
import { PartnerContext } from '../guards/partner-api-key.guard';

/**
 * INTEG-RAOS-002 (issue #5): DELETE /partner/products/:id.
 *
 * RAOS шлёт DELETE без предварительного архивирования, но INV (see
 * DeleteProductUseCase) запрещает удалять ACTIVE товар напрямую — сначала
 * нужно ARCHIVED. Партнёр не обязан знать наш state machine, поэтому здесь
 * авто-архивируем ACTIVE перед soft-delete вместо того чтобы возвращать
 * партнёру 422 и заставлять его делать двухшаговый вызов.
 */
@Injectable()
export class PartnerDeleteProductUseCase {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly changeStatus: ChangeProductStatusUseCase,
  ) {}

  async execute(ctx: PartnerContext, productId: string): Promise<void> {
    const product = await this.productsRepo.findById(productId);

    if (!product) {
      throw new DomainException(
        ErrorCode.PRODUCT_NOT_FOUND,
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }

    assertProductOwnership(product, ctx.storeId);

    if (product.status === ProductStatus.ACTIVE) {
      await this.changeStatus.execute(productId, ctx.storeId, ProductStatus.ARCHIVED);
    }

    await this.productsRepo.delete(productId);
  }
}
