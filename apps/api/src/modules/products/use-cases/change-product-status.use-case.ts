import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { Product, ProductStatus } from '@prisma/client';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { PrismaService } from '../../../database/prisma.service';
import { escapeTgHtml } from '../../../shared/telegram-html';

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
    // DB-AUDIT-001-07: не постим товары удалённых магазинов в TG-канал
    const store = await this.prisma.store.findFirst({
      where: { id: product.storeId, deletedAt: null },
    });
    if (!store?.telegramChannelId) return;

    // FEAT-TG-AUTOPOST-001: opt-in toggle. Продавец должен явно включить
    // авто-постинг в Settings. Для existing stores с channel migration
    // 20260510210000 set true (сохранение прежнего поведения).
    if (!store.autoPostProductsToChannel) return;

    const price       = `${Number(String(product.basePrice ?? 0)).toLocaleString('ru')} сум`;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? '';
    const tmaUrl      = process.env.TMA_URL ?? '';
    const deepLink    = botUsername && store.slug
      ? `https://t.me/${botUsername}?startapp=store_${store.slug}`
      : tmaUrl;
    const text    = `🛍 <b>${escapeTgHtml(product.title)}</b>\n\n${product.description ? `${escapeTgHtml(product.description)}\n\n` : ''}💰 <b>${price}</b>\n\n🏪 ${escapeTgHtml(store.name)}`;
    const buttons = [
      [{ text: '🛒 Открыть магазин', url: deepLink }],
      [{ text: '💬 Написать продавцу', url: store.telegramContactLink || deepLink }],
    ] as Array<Array<{ text: string; url: string }>>;

    // Загружаем все фото товара (сортировка по sortOrder)
    const allImages = await this.prisma.productImage.findMany({
      where: { productId: product.id },
      include: { media: true },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });

    type ImageWithMedia = { media?: { objectKey?: string; bucket?: string } };
    const tgFileIds = (allImages as unknown as ImageWithMedia[])
      .filter((img) => img.media?.bucket === 'telegram' && img.media.objectKey?.startsWith('tg:'))
      .map((img) => img.media!.objectKey!.replace('tg:', ''));

    if (tgFileIds.length >= 2) {
      // Media group — слайды; кнопки отдельным сообщением (Telegram API ограничение)
      await this.telegramBot.sendMediaGroupToChannel(store.telegramChannelId, tgFileIds, text, 'HTML');
      await this.telegramBot.sendToChannel(store.telegramChannelId, '👆 ' + product.title, buttons);
    } else if (tgFileIds.length === 1) {
      await this.telegramBot.sendPhotoToChannel(store.telegramChannelId, tgFileIds[0], text, buttons, 'HTML');
    } else {
      await this.telegramBot.sendToChannel(store.telegramChannelId, text, buttons, 'HTML');
    }
  }
}
