import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import {
  QUEUE_TELEGRAM_NOTIFICATIONS,
} from '../../../queues/queues.module';
import {
  TELEGRAM_JOB_CART_ABANDONED,
  NotifyCartAbandonedData,
} from '../../../queues/telegram-notification.processor';

/**
 * MARKETING-CART-ABANDONMENT-001 — мягкий ремаркетинг по брошенным корзинам.
 *
 * Раз в час сканирует ACTIVE-карты buyer'ов с telegramId,
 * которые не трогали >IDLE_HOURS, и шлёт один TG-nudge с deep-link.
 *
 * Условия для nudge:
 *  - cart.status === ACTIVE и есть хотя бы 1 item
 *  - cart.updatedAt < now - IDLE_HOURS (по умолчанию 4ч)
 *  - cart.buyer.user.telegramId != null
 *  - cart.nudgeCount < MAX_NUDGES (по умолчанию 1 — не спамить)
 *
 * Idempotent через nudgeSentAt+nudgeCount в БД: даже при retry job'а cart
 * уже помечен «нуднутым» до постановки в queue, повторного nudge не будет.
 *
 * После постановки в очередь — telegram-notification.processor шлёт сообщение.
 * Failed jobs не откатывают nudgeSentAt (приемлемо — мы и так не должны
 * нудить много раз; пропустить один nudge лучше чем поспамить).
 */
@Injectable()
export class CartAbandonmentService {
  private readonly logger = new Logger(CartAbandonmentService.name);

  private readonly IDLE_HOURS = 4;
  private readonly MAX_NUDGES = 1;
  private readonly BATCH_SIZE = 50;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_TELEGRAM_NOTIFICATIONS)
    private readonly telegramQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scan(): Promise<void> {
    if (process.env.CART_ABANDONMENT_ENABLED === 'false') {
      this.logger.debug('Cart-abandonment cron disabled by env');
      return;
    }

    const idleThreshold = new Date(Date.now() - this.IDLE_HOURS * 60 * 60 * 1000);
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'savdo_builderBOT';

    // Idle ACTIVE-карты с непустыми items, у которых ещё не исчерпан лимит nudge'ов.
    // Сортируем по самым «свежим» idle (updatedAt DESC) — чтобы первыми обработать
    // тех, кто почти ушёл, и не зависнуть на «давних» корзинах.
    const candidates = await this.prisma.cart.findMany({
      where: {
        status: 'ACTIVE',
        updatedAt: { lt: idleThreshold },
        nudgeCount: { lt: this.MAX_NUDGES },
        items: { some: {} },
        buyer: {
          user: {
            telegramId: { not: null },
            phone: { not: { startsWith: 'tg_' } }, // не нудим ghost-аккаунты
          },
        },
      },
      select: {
        id: true,
        currencyCode: true,
        nudgeCount: true,
        store: { select: { name: true, slug: true } },
        buyer: {
          select: {
            user: { select: { telegramId: true, languageCode: true } },
          },
        },
        items: {
          select: {
            quantity: true,
            unitPriceSnapshot: true,
            salePriceSnapshot: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: this.BATCH_SIZE,
    });

    if (candidates.length === 0) {
      this.logger.debug('Cart-abandonment: 0 idle carts');
      return;
    }

    let queued = 0;
    for (const cart of candidates) {
      const chatId = cart.buyer?.user?.telegramId?.toString();
      if (!chatId) continue;

      const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      const total = cart.items.reduce((sum, i) => {
        const price = Number(i.salePriceSnapshot ?? i.unitPriceSnapshot);
        return sum + price * i.quantity;
      }, 0);

      // Idempotency: помечаем cart ДО постановки job'а.
      // Если упадём после update, но до queue.add — пропустим этот nudge, но не зациклимся.
      const updated = await this.prisma.cart.updateMany({
        where: {
          id: cart.id,
          nudgeCount: { lt: this.MAX_NUDGES }, // защита от race с другим инстансом
        },
        data: {
          nudgeSentAt: new Date(),
          nudgeCount: { increment: 1 },
        },
      });
      if (updated.count === 0) continue; // race — другой инстанс уже нуднул

      // Deep-link на корзину магазина в TMA через startapp.
      const cartDeepLink = `https://t.me/${botUsername}?startapp=cart_${cart.store.slug}`;

      const data: NotifyCartAbandonedData = {
        cartId: cart.id,
        recipientChatId: chatId,
        storeName: cart.store.name,
        itemCount,
        total,
        currency: cart.currencyCode,
        cartDeepLink,
        locale: cart.buyer?.user?.languageCode ?? 'ru',
      };

      await this.telegramQueue.add(TELEGRAM_JOB_CART_ABANDONED, data, {
        // На случай scaling — один cartId не должен попадать в очередь дважды.
        jobId: `cart-abandoned:${cart.id}:${cart.nudgeCount + 1}`,
      });
      queued++;
    }

    this.logger.log(
      `Cart-abandonment: scanned ${candidates.length}, queued ${queued} TG-nudges`,
    );
  }
}
