import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { StoresRepository } from '../repositories/stores.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { TELEGRAM_JOB_BROADCAST } from '../../admin/use-cases/broadcast.use-case';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../../queues/queues.module';

// Telegram rate limit: 30 messages/sec → 1 message per ~34ms (same as admin BroadcastUseCase).
const BROADCAST_DELAY_MS = 34;
const COOLDOWN_HOURS = 6;

const BUYER_BASE_URL = () =>
  (process.env.BUYER_URL ?? 'https://shop.maxsavdo.uz').replace(/\/+$/, '');

/**
 * PARTNER-Q1-2026-08-03: продавец сам решает, когда объявить о новом
 * поступлении (кнопка «Сообщить о поступлении» в кабинете) — вариант 1а
 * из трёх предложенных (кнопка / авто-на-товар / авто-батч), выбран как
 * консервативный дефолт: без риска спама от массовой загрузки товаров.
 *
 * Аудитория — покупатели, у которых есть хотя бы один заказ в ЭТОМ магазине
 * (Order.storeId), не вся платформа — переиспользуем механику
 * `BroadcastUseCase` (та же очередь, тот же job `TELEGRAM_JOB_BROADCAST`,
 * тот же `BroadcastLog`), но со своей, узкой выборкой получателей.
 *
 * COOLDOWN_HOURS: защита от повторного спам-клика — не более 1 рассылки
 * на магазин раз в 6 часов. Cooldown читаем из последней `BroadcastLog`,
 * созданной ЭТИМ продавцом (createdBy = его userId) — отдельного поля/
 * миграции не потребовалось.
 */
@Injectable()
export class NotifyNewArrivalsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storesRepo: StoresRepository,
    private readonly sellersRepo: SellersRepository,
    @InjectQueue(QUEUE_TELEGRAM_NOTIFICATIONS) private readonly queue: Queue,
  ) {}

  async execute(sellerUserId: string): Promise<{ queued: number; nextAllowedAt: Date }> {
    const seller = await this.sellersRepo.findByUserId(sellerUserId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }
    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    const lastBroadcast = await this.prisma.broadcastLog.findFirst({
      where: { createdBy: sellerUserId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
    if (lastBroadcast) {
      const nextAllowedAt = new Date(lastBroadcast.createdAt.getTime() + cooldownMs);
      if (nextAllowedAt > new Date()) {
        throw new DomainException(
          ErrorCode.VALIDATION_ERROR,
          `Notify again after ${nextAllowedAt.toISOString()}`,
          HttpStatus.TOO_MANY_REQUESTS,
          { nextAllowedAt },
        );
      }
    }

    const buyers = await this.prisma.order.findMany({
      where: { storeId: store.id, buyerId: { not: null } },
      distinct: ['buyerId'],
      select: { buyer: { select: { user: { select: { telegramId: true } } } } },
    });

    const chatIds = [...new Set(
      buyers
        .map((o) => o.buyer?.user.telegramId?.toString())
        .filter((id): id is string => !!id),
    )];

    const storeName = (store as { name: string }).name;
    const storeSlug = (store as { slug: string }).slug;
    const message = `В магазине «${storeName}» новое поступление! Загляните в каталог 👉 ${BUYER_BASE_URL()}/${storeSlug}`;

    const log = await this.prisma.broadcastLog.create({
      data: { message, createdBy: sellerUserId },
    });

    if (chatIds.length > 0) {
      const jobs = chatIds.map((chatId, i) => ({
        name: TELEGRAM_JOB_BROADCAST,
        data: { chatId, message, broadcastLogId: log.id },
        opts: { delay: i * BROADCAST_DELAY_MS },
      }));
      await this.queue.addBulk(jobs);
    }

    return { queued: chatIds.length, nextAllowedAt: new Date(Date.now() + cooldownMs) };
  }
}
