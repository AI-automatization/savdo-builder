import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ModerationCaseStatus, OrderStatus, StoreStatus } from '@prisma/client';

/**
 * ADMIN-NOTIFICATIONS-001
 *
 * Aggregator-style repository: вместо отдельной таблицы admin_notifications
 * собирает «уведомления» on-the-fly из живых источников (moderation cases,
 * orders, stores). Это MVP — без write-path и без отдельного хранения
 * «прочитано». Состояние "read" хранится в localStorage админ-приложения
 * (см. NotificationDropdown). Минусы документированы — если понадобится
 * аудит "кто прочитал что", добавится отдельная таблица.
 */
@Injectable()
export class AdminNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Открытые модерационные кейсы (status=OPEN), отсортированные по createdAt DESC.
   */
  async findOpenModerationCases(limit: number) {
    return this.prisma.moderationCase.findMany({
      where: { status: ModerationCaseStatus.OPEN },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        caseType: true,
        reason: true,
        createdAt: true,
      },
    });
  }

  /**
   * Заказы со статусом PENDING — требуют внимания (новые заказы для админа).
   */
  async findPendingOrders(limit: number) {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING },
      orderBy: { placedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        customerFullName: true,
        placedAt: true,
        store: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Магазины ожидающие одобрения (PENDING_REVIEW).
   */
  async findStoresPendingReview(limit: number) {
    return this.prisma.store.findMany({
      where: { status: StoreStatus.PENDING_REVIEW },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        seller: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Грубые подсчёты — чтобы UI мог показать badge даже если items > limit.
   * Считаем в одной транзакции для согласованности.
   */
  async countOpenSources() {
    const [moderation, orders, stores] = await this.prisma.$transaction([
      this.prisma.moderationCase.count({ where: { status: ModerationCaseStatus.OPEN } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.store.count({ where: { status: StoreStatus.PENDING_REVIEW } }),
    ]);
    return { moderation, orders, stores };
  }
}
