import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../../queues/queues.module';
import {
  TELEGRAM_JOB_WISHLIST_PRICE_DROP,
  TELEGRAM_JOB_WISHLIST_BACK_IN_STOCK,
  NotifyWishlistData,
} from '../../../queues/telegram-notification.processor';

/**
 * MARKETING-WISHLIST-NOTIFY-001 — push-уведомления по wishlist.
 *
 * Раз в 4 часа сканирует wishlist items с заполненным `priceSnapshot` /
 * `inStockSnapshot` и шлёт nudge если:
 *  - PRICE_DROP: текущая цена < snapshot × (1 - MIN_DROP_PCT)
 *  - BACK_IN_STOCK: snapshot был out-of-stock, теперь ACTIVE + есть остаток
 *
 * Snapshot обновляется ПРИ ДОБАВЛЕНИИ в избранное (см. AddToWishlistUseCase).
 * Если snapshot пустой (legacy записи) — пропускаем (нет baseline).
 *
 * Idempotency: notifiedAt + notifiedReason помечаются в БД ДО queue.add'а
 * через `updateMany WHERE notifiedAt IS NULL OR notifiedAt < now - COOLDOWN`.
 * COOLDOWN_DAYS = 7 — одинаковый item не нудит чаще раза в неделю.
 *
 * После nudge snapshot ОБНОВЛЯЕТСЯ на текущее значение → следующий nudge
 * пойдёт только при новом изменении.
 */
@Injectable()
export class WishlistNotifyService {
  private readonly logger = new Logger(WishlistNotifyService.name);

  private readonly MIN_DROP_PCT = 0.10; // 10% — порог для price-drop nudge
  private readonly COOLDOWN_DAYS = 7;
  private readonly BATCH_SIZE = 100;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_TELEGRAM_NOTIFICATIONS)
    private readonly telegramQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_4_HOURS)
  async scan(): Promise<void> {
    if (process.env.WISHLIST_NOTIFY_ENABLED === 'false') {
      this.logger.debug('Wishlist-notify cron disabled by env');
      return;
    }

    const cooldownThreshold = new Date(Date.now() - this.COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'savdo_builderBOT';

    // Берём кандидатов с заполненным snapshot и истёкшим cooldown.
    // priceSnapshot IS NULL = legacy запись, не нудим (нет baseline).
    const candidates = await this.prisma.buyerWishlistItem.findMany({
      where: {
        priceSnapshot: { not: null },
        OR: [
          { notifiedAt: null },
          { notifiedAt: { lt: cooldownThreshold } },
        ],
        buyer: {
          user: {
            telegramId: { not: null },
            phone: { not: { startsWith: 'tg_' } }, // не ghost-аккаунты
          },
        },
        product: {
          deletedAt: null,
          status: 'ACTIVE',
          isVisible: true,
        },
      },
      select: {
        id: true,
        priceSnapshot: true,
        inStockSnapshot: true,
        product: {
          select: {
            id: true,
            title: true,
            basePrice: true,
            salePrice: true,
            currencyCode: true,
            status: true,
            isVisible: true,
            store: { select: { name: true, slug: true } },
            variants: {
              where: { isActive: true },
              select: { stockQuantity: true },
            },
          },
        },
        buyer: {
          select: {
            user: { select: { telegramId: true, languageCode: true } },
          },
        },
      },
      take: this.BATCH_SIZE,
    });

    if (candidates.length === 0) {
      this.logger.debug('Wishlist-notify: 0 candidates');
      return;
    }

    let queuedDrop = 0;
    let queuedStock = 0;

    for (const item of candidates) {
      const chatId = item.buyer?.user?.telegramId?.toString();
      if (!chatId) continue;
      const p = item.product;
      if (!p) continue;

      const oldPrice = Number(item.priceSnapshot);
      const currentPrice = Number(p.salePrice ?? p.basePrice);
      const wasOutOfStock = item.inStockSnapshot === false;
      const hasVariants = p.variants.length > 0;
      const anyVariantInStock = hasVariants && p.variants.some((v) => v.stockQuantity > 0);
      const nowInStock =
        p.status === 'ACTIVE' &&
        p.isVisible &&
        (!hasVariants || anyVariantInStock);

      let reason: 'PRICE_DROP' | 'BACK_IN_STOCK' | null = null;
      if (wasOutOfStock && nowInStock) {
        reason = 'BACK_IN_STOCK';
      } else if (
        nowInStock &&
        oldPrice > 0 &&
        currentPrice < oldPrice * (1 - this.MIN_DROP_PCT)
      ) {
        reason = 'PRICE_DROP';
      }
      if (!reason) continue;

      // Idempotent update — race-safe между инстансами.
      const updated = await this.prisma.buyerWishlistItem.updateMany({
        where: {
          id: item.id,
          OR: [
            { notifiedAt: null },
            { notifiedAt: { lt: cooldownThreshold } },
          ],
        },
        data: {
          notifiedAt: new Date(),
          notifiedReason: reason,
          // Обновляем snapshot — следующий nudge только при новом изменении.
          priceSnapshot: currentPrice,
          inStockSnapshot: nowInStock,
        },
      });
      if (updated.count === 0) continue;

      const productDeepLink = `https://t.me/${botUsername}?startapp=product_${p.store.slug}_${p.id}`;
      const data: NotifyWishlistData = {
        wishlistItemId: item.id,
        recipientChatId: chatId,
        productTitle: p.title,
        storeName: p.store.name,
        storeSlug: p.store.slug,
        oldPrice,
        newPrice: currentPrice,
        currency: p.currencyCode,
        productDeepLink,
        locale: item.buyer?.user?.languageCode ?? 'ru',
      };

      const jobName = reason === 'PRICE_DROP'
        ? TELEGRAM_JOB_WISHLIST_PRICE_DROP
        : TELEGRAM_JOB_WISHLIST_BACK_IN_STOCK;
      await this.telegramQueue.add(jobName, data, {
        jobId: `wishlist:${item.id}:${reason}:${Date.now()}`,
      });
      if (reason === 'PRICE_DROP') queuedDrop++;
      else queuedStock++;
    }

    this.logger.log(
      `Wishlist-notify: scanned ${candidates.length}, queued ${queuedDrop} price-drop + ${queuedStock} back-in-stock`,
    );
  }
}
