import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { Product, ProductStatus } from '@prisma/client';
import { PostProductToChannelUseCase } from './post-product-to-channel.use-case';

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
  private readonly logger = new Logger(ChangeProductStatusUseCase.name);

  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly postToChannel: PostProductToChannelUseCase,
  ) {}

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

    const updated = await this.productsRepo.updateStatus(id, newStatus);

    // FEAT-TG-AUTOPOST-001: при → ACTIVE авто-постинг в TG-канал продавца.
    // Делегируем единому use-case (он сам проверяет autoPostProductsToChannel,
    // telegramChannelId, рендерит шаблон, шлёт фото как photo не document,
    // кэширует photoFileId). Fire-and-forget — не блокируем seller response.
    if (newStatus === ProductStatus.ACTIVE) {
      void this.postToChannel.execute({ productId: id }).catch((err) => {
        this.logger.warn(`autoPost failed for product=${id}: ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    return updated;
  }
}
