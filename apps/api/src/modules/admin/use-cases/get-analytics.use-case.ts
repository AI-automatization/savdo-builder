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
  revenue: number;
}

export interface KpiStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  cancelledPct: number;
  newSellers: number;
  newStores: number;
}

export interface FunnelStep {
  event: string;
  label: string;
  count: number;
  pct: number;
}

export interface DailyGrowthStat {
  date: string;
  sellers: number;
  stores: number;
}

export interface AnalyticsSummary {
  kpi: KpiStats;
  ordersPerDay: DailyOrderStat[];
  topStores: TopStore[];
  funnel: FunnelStep[];
  growth: DailyGrowthStat[];
}

const FUNNEL_STEPS = [
  { event: 'storefront_viewed', label: 'Просмотр витрины' },
  { event: 'product_viewed',    label: 'Просмотр товара' },
  { event: 'add_to_cart',       label: 'В корзину' },
  { event: 'checkout_started',  label: 'Начат чекаут' },
  { event: 'order_created',     label: 'Заказ создан' },
];

@Injectable()
export class GetAnalyticsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<AnalyticsSummary> {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    // ── Orders (last 30 days) ─────────────────────────────────────────────────
    const orders = await this.prisma.order.findMany({
      where: { placedAt: { gte: since } },
      select: {
        placedAt: true,
        storeId: true,
        status: true,
        totalAmount: true,
        store: { select: { name: true } },
      },
    });

    // KPI
    const totalOrders = orders.length;
    const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
    const paidOrders = orders.filter(o => o.status !== 'CANCELLED');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
    const cancelledPct = totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0;

    const [newSellers, newStores] = await Promise.all([
      this.prisma.seller.count({ where: { createdAt: { gte: since } } }),
      this.prisma.store.count({ where: { createdAt: { gte: since } } }),
    ]);

    const kpi: KpiStats = {
      totalOrders,
      totalRevenue: Math.round(totalRevenue),
      avgOrderValue: Math.round(avgOrderValue),
      cancelledPct,
      newSellers,
      newStores,
    };

    // ── Orders per day ────────────────────────────────────────────────────────
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

    // ── Top 10 stores ─────────────────────────────────────────────────────────
    const storeMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const o of orders) {
      const entry = storeMap.get(o.storeId);
      const rev = o.status !== 'CANCELLED' ? Number(o.totalAmount) : 0;
      if (entry) {
        entry.count++;
        entry.revenue += rev;
      } else {
        storeMap.set(o.storeId, { name: o.store.name, count: 1, revenue: rev });
      }
    }
    const topStores: TopStore[] = Array.from(storeMap.entries())
      .map(([storeId, { name, count, revenue }]) => ({
        storeId,
        storeName: name,
        orderCount: count,
        revenue: Math.round(revenue),
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);

    // ── Funnel (analytics_events last 30 days) ────────────────────────────────
    const eventCounts = await this.prisma.analyticsEvent.groupBy({
      by: ['eventName'],
      where: {
        eventName: { in: FUNNEL_STEPS.map(s => s.event) },
        createdAt: { gte: since },
      },
      _count: { id: true },
    });

    const countMap = new Map(eventCounts.map(e => [e.eventName, e._count.id]));
    const topCount = countMap.get('storefront_viewed') ?? 1;
    const funnel: FunnelStep[] = FUNNEL_STEPS.map(step => {
      const count = countMap.get(step.event) ?? 0;
      return {
        event: step.event,
        label: step.label,
        count,
        pct: topCount > 0 ? Math.round((count / topCount) * 100) : 0,
      };
    });

    // ── Growth: new sellers/stores per day ────────────────────────────────────
    const [sellersByDay, storesByDay] = await Promise.all([
      this.prisma.$queryRaw<Array<{ date: string; cnt: bigint }>>`
        SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS cnt
        FROM sellers
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
      `,
      this.prisma.$queryRaw<Array<{ date: string; cnt: bigint }>>`
        SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS cnt
        FROM stores
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
      `,
    ]);

    const sellerDayMap = new Map<string, number>();
    const storeDayMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      sellerDayMap.set(key, 0);
      storeDayMap.set(key, 0);
    }
    for (const row of sellersByDay) sellerDayMap.set(row.date, Number(row.cnt));
    for (const row of storesByDay) storeDayMap.set(row.date, Number(row.cnt));

    const growth: DailyGrowthStat[] = Array.from(sellerDayMap.keys()).map(date => ({
      date,
      sellers: sellerDayMap.get(date) ?? 0,
      stores: storeDayMap.get(date) ?? 0,
    }));

    return { kpi, ordersPerDay, topStores, funnel, growth };
  }
}
