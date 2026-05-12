import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StoresRepository } from '../repositories/stores.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import {
  PostProductToChannelUseCase,
  PostResult,
} from '../../products/use-cases/post-product-to-channel.use-case';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * FEAT-TG-CHANNEL-TEMPLATE-001: триггер тестовой публикации.
 *
 * Берёт самый свежий ACTIVE-товар продавца и постит его в канал
 * (force=true — игнорирует `autoPostProductsToChannel`). Так продавец
 * проверяет шаблон + что фото отправляется как изображение, а бот имеет
 * права в канале.
 *
 * Если в магазине ещё нет ACTIVE-товаров — возвращает понятную ошибку
 * (frontend покажет «Сначала опубликуйте хотя бы один товар»).
 */
@Injectable()
export class TriggerChannelTestPostUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storesRepo: StoresRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly postToChannel: PostProductToChannelUseCase,
  ) {}

  async execute(userId: string): Promise<PostResult> {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }

    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    if (!store.telegramChannelId) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Telegram channel is not configured. Привяжите канал перед тестовой публикацией.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const product = await this.prisma.product.findFirst({
      where: { storeId: store.id, deletedAt: null, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!product) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'No published products to use as test sample. Опубликуйте хотя бы один товар.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.postToChannel.execute({ productId: product.id, force: true });
  }
}
