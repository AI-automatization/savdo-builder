import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductStatus } from '@prisma/client';
import { ProductsRepository } from '../repositories/products.repository';
import { ChangeProductStatusUseCase } from '../use-cases/change-product-status.use-case';

const BATCH_SIZE = 50;

/**
 * FEAT-SCHEDULED-PUBLISH-001: раз в минуту забирает DRAFT-товары с
 * `scheduledPublishAt <= now()` и публикует их через тот же
 * `ChangeProductStatusUseCase`, что и ручная кнопка «Опубликовать» —
 * значит появление в магазине и автопостинг в TG-канал (если у магазина
 * включён `autoPostProductsToChannel`) срабатывают одним и тем же кодом,
 * без дублирования условий FEAT-TG-AUTOPOST-001.
 *
 * Fail-tolerant: ошибка на одном товаре не блокирует остальные в батче.
 */
@Injectable()
export class ScheduledPublishProcessor {
  private readonly logger = new Logger(ScheduledPublishProcessor.name);

  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly changeStatus: ChangeProductStatusUseCase,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async scan(): Promise<void> {
    const due = await this.productsRepo.findDueScheduledPublish(BATCH_SIZE);
    if (due.length === 0) return;

    for (const product of due) {
      try {
        await this.changeStatus.execute(product.id, product.storeId, ProductStatus.ACTIVE);
        await this.productsRepo.setScheduledPublishAt(product.id, null);
      } catch (err) {
        this.logger.warn(
          `scheduled publish failed for product=${product.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
