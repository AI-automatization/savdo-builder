import { Injectable } from '@nestjs/common';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionTier,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySellerId(sellerId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({ where: { sellerId } });
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({ where: { id } });
  }

  async create(data: {
    sellerId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    trialStartedAt?: Date;
    trialEndsAt?: Date;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }): Promise<Subscription> {
    return this.prisma.subscription.create({ data });
  }

  async update(
    id: string,
    data: Prisma.SubscriptionUpdateInput,
  ): Promise<Subscription> {
    return this.prisma.subscription.update({ where: { id }, data });
  }

  /**
   * Поиск подписок c trialEndsAt < now и статусом TRIAL — кандидаты на TRIAL → PAST_DUE.
   * Используется в SubscriptionExpiryProcessor (cron).
   */
  async findExpiredTrials(now: Date) {
    return this.prisma.subscription.findMany({
      where: { status: 'TRIAL', trialEndsAt: { lt: now } },
    });
  }

  /** Поиск ACTIVE с currentPeriodEnd < now — кандидаты на ACTIVE → PAST_DUE. */
  async findExpiredActive(now: Date) {
    return this.prisma.subscription.findMany({
      where: { status: 'ACTIVE', currentPeriodEnd: { lt: now } },
    });
  }

  /** Поиск PAST_DUE с graceEndsAt < now — кандидаты на PAST_DUE → SUSPENDED. */
  async findExpiredGrace(now: Date) {
    return this.prisma.subscription.findMany({
      where: { status: 'PAST_DUE', graceEndsAt: { lt: now } },
    });
  }

  /** Admin listing с фильтрами + пагинацией. */
  async findAllAdmin(opts: {
    status?: SubscriptionStatus;
    tier?: SubscriptionTier;
    sellerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = opts.limit ? Math.min(Math.max(opts.limit, 1), 100) : 50;
    const where: Prisma.SubscriptionWhereInput = {
      ...(opts.status && { status: opts.status }),
      ...(opts.tier && { tier: opts.tier }),
      ...(opts.sellerId && { sellerId: opts.sellerId }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { seller: { select: { id: true, fullName: true, telegramUsername: true } } },
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return { items, total, page, limit };
  }
}
