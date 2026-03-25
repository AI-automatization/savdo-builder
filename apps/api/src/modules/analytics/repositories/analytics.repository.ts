import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AnalyticsEvent } from '@prisma/client';

export interface TrackEventData {
  actorUserId?: string;
  actorType?: string;
  storeId?: string;
  eventName: string;
  eventPayload?: object;
  sessionKey?: string;
}

export interface FindEventsFilters {
  eventName?: string;
  storeId?: string;
  actorUserId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface FindEventsResult {
  events: AnalyticsEvent[];
  total: number;
}

export interface SellerSummary {
  views: number;
  topProduct: { productId: string; views: number } | null;
  conversionRate: number;
}

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Append-only — never UPDATE or DELETE
  async track(data: TrackEventData): Promise<void> {
    await this.prisma.analyticsEvent.create({
      data: {
        actorUserId: data.actorUserId ?? null,
        actorType: data.actorType ?? null,
        storeId: data.storeId ?? null,
        eventName: data.eventName,
        eventPayload: (data.eventPayload ?? {}) as object,
        sessionKey: data.sessionKey ?? null,
      },
    });
  }

  async findEvents(filters: FindEventsFilters): Promise<FindEventsResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 100;
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.eventName ? { eventName: filters.eventName } : {}),
      ...(filters.storeId ? { storeId: filters.storeId } : {}),
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...((filters.from || filters.to)
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const [events, total] = await this.prisma.$transaction([
      this.prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.analyticsEvent.count({ where }),
    ]);

    return { events, total };
  }

  async getSellerSummary(storeId: string): Promise<SellerSummary> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [views, orderCount, storefrontViews, topProductRows] =
      await this.prisma.$transaction([
        this.prisma.analyticsEvent.count({
          where: {
            storeId,
            eventName: { in: ['storefront_viewed', 'product_viewed'] },
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.analyticsEvent.count({
          where: { storeId, eventName: 'order_created', createdAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.analyticsEvent.count({
          where: { storeId, eventName: 'storefront_viewed', createdAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.$queryRaw<{ productId: string; views: number }[]>`
          SELECT event_payload->>'productId' AS "productId",
                 COUNT(*)::int              AS views
          FROM   analytics_events
          WHERE  store_id   = ${storeId}
            AND  event_name = 'product_viewed'
            AND  created_at >= ${thirtyDaysAgo}
            AND  event_payload->>'productId' IS NOT NULL
          GROUP  BY event_payload->>'productId'
          ORDER  BY views DESC
          LIMIT  1
        `,
      ]);

    return {
      views,
      topProduct: topProductRows[0] ?? null,
      conversionRate:
        storefrontViews > 0
          ? Math.round((orderCount / storefrontViews) * 1000) / 10
          : 0,
    };
  }
}
