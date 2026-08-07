import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { ProductsRepository } from '../repositories/products.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { assertProductOwnership } from '../guards/product-ownership.guard';

/**
 * FEAT-SCHEDULED-PUBLISH-001: продавец ставит будущее время публикации
 * DRAFT-товара (как отложенная отправка в Telegram) — в это время cron
 * (`ScheduledPublishProcessor`) переведёт товар DRAFT→ACTIVE через тот же
 * `ChangeProductStatusUseCase`, что и ручная публикация — значит и появление
 * в магазине, и автопостинг в TG-канал сработают синхронно, одним и тем же
 * кодом, без дублирования логики.
 *
 * Только для DRAFT: ACTIVE уже виден, ARCHIVED нужно сначала вернуть в DRAFT
 * обычным переходом статуса.
 */
@Injectable()
export class ScheduleProductPublishUseCase {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async execute(
    productId: string,
    storeId: string,
    publishAt: string | null | undefined,
  ): Promise<{ id: string; scheduledPublishAt: Date | null }> {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }

    assertProductOwnership(product, storeId);

    if (product.status !== ProductStatus.DRAFT) {
      throw new DomainException(
        ErrorCode.PRODUCT_INVALID_TRANSITION,
        'Only DRAFT products can be scheduled',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (!publishAt) {
      const updated = await this.productsRepo.setScheduledPublishAt(productId, null);
      return { id: updated.id, scheduledPublishAt: null };
    }

    const at = new Date(publishAt);
    if (at.getTime() <= Date.now()) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'publishAt must be in the future',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const updated = await this.productsRepo.setScheduledPublishAt(productId, at);
    return { id: updated.id, scheduledPublishAt: updated.scheduledPublishAt };
  }
}
