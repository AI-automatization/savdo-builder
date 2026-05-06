import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface SellerAnalyticsInput {
  from?: string;
  to?: string;
}

export interface DailyPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string | null;
  title: string;
  quantity: number;
  revenue: number;
}

export interface SellerAnalytics {
  range: { from: string; to: string };
  revenue: { total: number; completed: number; pending: number };
  orders: { total: number; byStatus: Record<string, number> };
  topProducts: TopProduct[];
  daily: DailyPoint[];
}

const MAX_RANGE_DAYS = 90;
const PENDING_REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED'] as const;

@Injectable()
export class GetSellerAnalyticsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(user: JwtPayload, input: SellerAnalyticsInput): Promise<SellerAnalytics> {
    const store = await this.prisma.store.findFirst({
      where: { seller: { userId: user.sub }, deletedAt: null },
      select: { id: true },
    });
    if (!store) {
      throw new NotFoundException({ code: ErrorCode.STORE_NOT_FOUND });
    }

    const { from, to } = parseRange(input.from, input.to);

    const [orders, items] = await Promise.all([
      this.prisma.order.findMany({
        where: { storeId: store.id, placedAt: { gte: from, lte: to } },
        select: { id: true, status: true, totalAmount: true, placedAt: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: { storeId: store.id, placedAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
        },
        select: {
          productId: true,
          productTitleSnapshot: true,
          quantity: true,
          lineTotalAmount: true,
        },
      }),
    ]);

    const byStatus: Record<string, number> = {
      PENDING: 0, CONFIRMED: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0,
    };
    let revenueCompleted = 0;
    let revenuePending = 0;
    const dailyMap = new Map<string, { revenue: number; orderCount: number }>();

    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      const total = Number(o.totalAmount);
      const dayKey = isoDate(o.placedAt);
      const cell = dailyMap.get(dayKey) ?? { revenue: 0, orderCount: 0 };
      cell.orderCount += 1;
      if (o.status === 'DELIVERED') {
        revenueCompleted += total;
        cell.revenue += total;
      } else if ((PENDING_REVENUE_STATUSES as readonly string[]).includes(o.status)) {
        revenuePending += total;
      }
      dailyMap.set(dayKey, cell);
    }

    const topMap = new Map<string, TopProduct>();
    for (const it of items) {
      const key = it.productId ?? `__snapshot__:${it.productTitleSnapshot}`;
      const cur = topMap.get(key) ?? {
        productId: it.productId ?? null,
        title: it.productTitleSnapshot,
        quantity: 0,
        revenue: 0,
      };
      cur.quantity += it.quantity;
      cur.revenue += Number(it.lineTotalAmount);
      topMap.set(key, cur);
    }
    const topProducts = [...topMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const daily = fillDailyBuckets(from, to, dailyMap);

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      revenue: {
        total: round2(revenueCompleted + revenuePending),
        completed: round2(revenueCompleted),
        pending: round2(revenuePending),
      },
      orders: { total: orders.length, byStatus },
      topProducts: topProducts.map((p) => ({ ...p, revenue: round2(p.revenue) })),
      daily,
    };
  }
}

function parseRange(rawFrom?: string, rawTo?: string): { from: Date; to: Date } {
  const now = new Date();
  const to = rawTo ? new Date(rawTo) : now;
  const from = rawFrom
    ? new Date(rawFrom)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new BadRequestException('Invalid date format — use ISO 8601');
  }
  if (from > to) {
    throw new BadRequestException('`from` must be earlier than `to`');
  }
  const days = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (days > MAX_RANGE_DAYS) {
    throw new BadRequestException(`Range too large — maximum ${MAX_RANGE_DAYS} days`);
  }
  return { from, to };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fillDailyBuckets(
  from: Date,
  to: Date,
  data: Map<string, { revenue: number; orderCount: number }>,
): DailyPoint[] {
  const out: DailyPoint[] = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const stop = new Date(to);
  stop.setUTCHours(0, 0, 0, 0);
  while (cursor <= stop) {
    const key = isoDate(cursor);
    const cell = data.get(key);
    out.push({
      date: key,
      revenue: round2(cell?.revenue ?? 0),
      orderCount: cell?.orderCount ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}
