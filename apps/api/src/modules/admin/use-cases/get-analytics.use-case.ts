import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface DailyOrderStat {
  date: string; // 'YYYY-MM-DD'
  count: number;
}

export interface TopStore {
  storeId: string;
  storeName: string;
  orderCount: number;
}

export interface AnalyticsSummary {
  ordersPerDay: DailyOrderStat[];
  topStores: TopStore[];
}

@Injectable()
export class GetAnalyticsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<AnalyticsSummary> {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { placedAt: { gte: since } },
      select: { placedAt: true, storeId: true, store: { select: { name: true } } },
    });

    // Orders per day
    const dayMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of orders) {
      const key = o.placedAt.toISOString().slice(0, 10);
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
    const ordersPerDay: DailyOrderStat[] = Array.from(dayMap.entries()).map(
      ([date, count]) => ({ date, count }),
    );

    // Top 5 stores
    const storeMap = new Map<string, { name: string; count: number }>();
    for (const o of orders) {
      const entry = storeMap.get(o.storeId);
      if (entry) {
        entry.count++;
      } else {
        storeMap.set(o.storeId, { name: o.store.name, count: 1 });
      }
    }
    const topStores: TopStore[] = Array.from(storeMap.entries())
      .map(([storeId, { name, count }]) => ({ storeId, storeName: name, orderCount: count }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);

    return { ordersPerDay, topStores };
  }
}
