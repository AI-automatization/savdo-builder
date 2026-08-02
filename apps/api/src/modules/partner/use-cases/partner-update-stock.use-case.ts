import { HttpStatus, Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { assertProductOwnership } from '../../products/guards/product-ownership.guard';
import { PartnerContext } from '../guards/partner-api-key.guard';

/**
 * INTEG-RAOS-002 (issue #5): PATCH /partner/products/:id/stock.
 *
 * Партнёрские товары создаются без вариантов (PartnerCreateProductUseCase не
 * заводит ProductVariant) — сток у них живёт в денормализованном
 * `Product.totalStock` (single-SKU режим, см. product-presenter.service.ts).
 * Если продавец позже вручную завёл варианты у этого же товара — сток теперь
 * per-variant, и partner-обновление totalStock напрямую было бы бессмысленным
 * (checkout читает totalStock только когда variants нет) — отклоняем явно,
 * а не молча пишем поле, которое никто не читает.
 */
@Injectable()
export class PartnerUpdateStockUseCase {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async execute(ctx: PartnerContext, productId: string, stock: number): Promise<Product> {
    const product = await this.productsRepo.findById(productId);

    if (!product) {
      throw new DomainException(
        ErrorCode.PRODUCT_NOT_FOUND,
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }

    assertProductOwnership(product, ctx.storeId);

    if (product.hasVariants) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Product uses per-variant stock — partner stock endpoint only supports single-SKU products',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.productsRepo.setTotalStock(productId, stock);
  }
}
