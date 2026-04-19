import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { Product, ProductStatus } from '@prisma/client';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { PrismaService } from '../../../database/prisma.service';

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
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly telegramBot: TelegramBotService,
    private readonly prisma: PrismaService,
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

    // Автопостинг в TG канал при публикации товара
    if (newStatus === ProductStatus.ACTIVE) {
      this.postToChannel(updated).catch(() => null); // fire-and-forget, не блокируем ответ
    }

    return updated;
  }

  private async postToChannel(product: Product): Promise<void> {
    const store = await this.prisma.store.findUnique({ where: { id: product.storeId } });
    if (!store?.telegramChannelId) return;

    const price       = `${Number(String(product.basePrice ?? 0)).toLocaleString('ru')} сум`;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? '';
    const tmaUrl      = process.env.TMA_URL ?? '';
    const deepLink    = botUsername && store.slug
      ? `https://t.me/${botUsername}?startapp=store_${store.slug}`
      : tmaUrl;
    const text    = `🛍 <b>${product.title}</b>\n\n${product.description ? `${product.description}\n\n` : ''}💰 <b>${price}</b>\n\n🏪 ${store.name}`;
    const buttons = [
      [{ text: '🛒 Открыть магазин', url: deepLink }],
      [{ text: '💬 Написать продавцу', url: store.telegramContactLink || deepLink }],
    ] as Array<Array<{ text: string; url: string }>>;

    // Ищем главное фото товара
    const primaryImage = await this.prisma.productImage.findFirst({
      where: { productId: product.id, isPrimary: true },
      include: { media: true },
    });

    const media = (primaryImage as unknown as { media?: { objectKey?: string; bucket?: string } } | null)?.media;
    if (media?.bucket === 'telegram' && media.objectKey?.startsWith('tg:')) {
      const fileId = media.objectKey.replace('tg:', '');
      await this.telegramBot.sendPhotoToChannel(store.telegramChannelId, fileId, text, buttons, 'HTML');
    } else {
      await this.telegramBot.sendToChannel(store.telegramChannelId, text, buttons, 'HTML');
    }
  }
}
