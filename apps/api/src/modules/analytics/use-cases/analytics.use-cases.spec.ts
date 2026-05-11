/**
 * Объединённые тесты для analytics use-cases:
 *   - TrackEvent: feature flag, role-to-actorType mapping, guest fallback
 *   - QueryEvents: from/to ISO parsing, optional fields
 *   - GetSellerSummary: store ownership через seller.userId, 404 если не найден
 *   - GetSellerAnalytics: range parsing (default 30d, max 90d, from < to),
 *     status grouping, revenue split (completed=DELIVERED, pending=CONF/PROC/SHIP),
 *     topProducts top-5, daily buckets fill (включая дни без заказов)
 */
import { ConfigService } from '@nestjs/config';
import { TrackEventUseCase } from './track-event.use-case';
import { QueryEventsUseCase } from './query-events.use-case';
import { GetSellerSummaryUseCase } from './get-seller-summary.use-case';
import { GetSellerAnalyticsUseCase } from './get-seller-analytics.use-case';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { PrismaService } from '../../../database/prisma.service';

describe('TrackEventUseCase', () => {
  let useCase: TrackEventUseCase;
  let repo: { track: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    repo = { track: jest.fn().mockResolvedValue(undefined) };
    config = { get: jest.fn().mockReturnValue(true) };
    useCase = new TrackEventUseCase(
      repo as unknown as AnalyticsRepository,
      config as unknown as ConfigService,
    );
  });

  it('analyticsEnabled=false → no-op', async () => {
    config.get.mockReturnValue(false);
    await useCase.execute({ dto: { eventName: 'x' } as any });
    expect(repo.track).not.toHaveBeenCalled();
  });

  it('user без role → actorType="guest"', async () => {
    await useCase.execute({ dto: { eventName: 'x' } as any });
    expect(repo.track).toHaveBeenCalledWith(expect.objectContaining({
      actorType: 'guest',
      actorUserId: undefined,
    }));
  });

  it('BUYER → actorType="buyer", actorUserId=user.sub', async () => {
    await useCase.execute({
      dto: { eventName: 'storefront_viewed', storeId: 'store-1' } as any,
      user: { sub: 'u-1', role: 'BUYER' } as any,
    });
    expect(repo.track).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: 'u-1',
      actorType: 'buyer',
      eventName: 'storefront_viewed',
      storeId: 'store-1',
    }));
  });

  it('SELLER/ADMIN маппинг', async () => {
    await useCase.execute({ dto: { eventName: 'x' } as any, user: { sub: 'u-1', role: 'SELLER' } as any });
    expect(repo.track).toHaveBeenCalledWith(expect.objectContaining({ actorType: 'seller' }));
    repo.track.mockClear();
    await useCase.execute({ dto: { eventName: 'x' } as any, user: { sub: 'u-2', role: 'ADMIN' } as any });
    expect(repo.track).toHaveBeenCalledWith(expect.objectContaining({ actorType: 'admin' }));
  });

  it('неизвестная role → "guest"', async () => {
    await useCase.execute({ dto: { eventName: 'x' } as any, user: { sub: 'u', role: 'WTF' } as any });
    expect(repo.track).toHaveBeenCalledWith(expect.objectContaining({ actorType: 'guest' }));
  });
});

describe('QueryEventsUseCase', () => {
  let useCase: QueryEventsUseCase;
  let repo: { findEvents: jest.Mock };

  beforeEach(() => {
    repo = { findEvents: jest.fn().mockResolvedValue({ events: [], total: 0 }) };
    useCase = new QueryEventsUseCase(repo as unknown as AnalyticsRepository);
  });

  it('from/to ISO → конвертируются в Date', async () => {
    await useCase.execute({
      from: '2026-01-01', to: '2026-02-01',
      eventName: 'x', storeId: 'store-1', actorUserId: 'u-1',
      page: 1, limit: 10,
    } as any);
    expect(repo.findEvents).toHaveBeenCalledWith(expect.objectContaining({
      from: new Date('2026-01-01'),
      to: new Date('2026-02-01'),
      eventName: 'x',
      storeId: 'store-1',
    }));
  });

  it('from/to не заданы → undefined', async () => {
    await useCase.execute({ eventName: 'x' } as any);
    expect(repo.findEvents).toHaveBeenCalledWith(expect.objectContaining({
      from: undefined,
      to: undefined,
    }));
  });
});

describe('GetSellerSummaryUseCase', () => {
  let useCase: GetSellerSummaryUseCase;
  let prisma: { store: { findFirst: jest.Mock } };
  let repo: { getSellerSummary: jest.Mock };

  beforeEach(() => {
    prisma = { store: { findFirst: jest.fn() } };
    repo = { getSellerSummary: jest.fn().mockResolvedValue({ totalRevenue: 0 }) };
    useCase = new GetSellerSummaryUseCase(
      prisma as unknown as PrismaService,
      repo as unknown as AnalyticsRepository,
    );
  });

  it('нет store у seller → NotFoundException', async () => {
    prisma.store.findFirst.mockResolvedValue(null);
    await expect(useCase.execute({ sub: 'u-1' } as any))
      .rejects.toThrow(/Not Found/);
  });

  it('store найден → repo.getSellerSummary(store.id)', async () => {
    prisma.store.findFirst.mockResolvedValue({ id: 'store-1' });
    await useCase.execute({ sub: 'u-1' } as any);
    expect(prisma.store.findFirst).toHaveBeenCalledWith({
      where: { seller: { userId: 'u-1' }, deletedAt: null },
      select: { id: true },
    });
    expect(repo.getSellerSummary).toHaveBeenCalledWith('store-1');
  });
});

describe('GetSellerAnalyticsUseCase', () => {
  let useCase: GetSellerAnalyticsUseCase;
  let prisma: {
    store: { findFirst: jest.Mock };
    order: { findMany: jest.Mock };
    orderItem: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      store: { findFirst: jest.fn().mockResolvedValue({ id: 'store-1' }) },
      order: { findMany: jest.fn().mockResolvedValue([]) },
      orderItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    useCase = new GetSellerAnalyticsUseCase(prisma as unknown as PrismaService);
  });

  it('store нет → NotFoundException', async () => {
    prisma.store.findFirst.mockResolvedValue(null);
    await expect(useCase.execute({ sub: 'u-1' } as any, {})).rejects.toThrow(/Not Found/);
  });

  it('invalid from/to → BadRequest', async () => {
    await expect(useCase.execute({ sub: 'u-1' } as any, { from: 'wtf' }))
      .rejects.toThrow(/Invalid date/);
  });

  it('from > to → BadRequest', async () => {
    await expect(useCase.execute({ sub: 'u-1' } as any, {
      from: '2026-02-01', to: '2026-01-01',
    })).rejects.toThrow(/earlier than/);
  });

  it('range > 90 дней → BadRequest', async () => {
    await expect(useCase.execute({ sub: 'u-1' } as any, {
      from: '2026-01-01', to: '2026-12-31',
    })).rejects.toThrow(/Range too large/);
  });

  it('default range = 30 дней назад до now', async () => {
    const result = await useCase.execute({ sub: 'u-1' } as any, {});
    expect(result.range.from).toBeDefined();
    expect(result.range.to).toBeDefined();
    const fromTs = new Date(result.range.from).getTime();
    const toTs = new Date(result.range.to).getTime();
    const days = (toTs - fromTs) / (24 * 60 * 60 * 1000);
    expect(Math.round(days)).toBeGreaterThanOrEqual(29);
    expect(Math.round(days)).toBeLessThanOrEqual(31);
  });

  it('revenue split: DELIVERED→completed, CONF/PROC/SHIP→pending', async () => {
    prisma.order.findMany.mockResolvedValue([
      { id: 'o-1', status: 'DELIVERED', totalAmount: 100, placedAt: new Date('2026-05-01') },
      { id: 'o-2', status: 'CONFIRMED', totalAmount: 50, placedAt: new Date('2026-05-01') },
      { id: 'o-3', status: 'PROCESSING', totalAmount: 30, placedAt: new Date('2026-05-01') },
      { id: 'o-4', status: 'SHIPPED', totalAmount: 20, placedAt: new Date('2026-05-01') },
      { id: 'o-5', status: 'CANCELLED', totalAmount: 999, placedAt: new Date('2026-05-01') },
    ]);
    const result = await useCase.execute({ sub: 'u-1' } as any, {
      from: '2026-04-15', to: '2026-05-10',
    });
    expect(result.revenue.completed).toBe(100);
    expect(result.revenue.pending).toBe(100); // 50+30+20
    expect(result.revenue.total).toBe(200);
    expect(result.orders.total).toBe(5);
    expect(result.orders.byStatus.DELIVERED).toBe(1);
    expect(result.orders.byStatus.CANCELLED).toBe(1);
  });

  it('topProducts → top-5 sorted by revenue desc', async () => {
    prisma.orderItem.findMany.mockResolvedValue([
      { productId: 'p-1', productTitleSnapshot: 'A', quantity: 1, lineTotalAmount: 100 },
      { productId: 'p-2', productTitleSnapshot: 'B', quantity: 2, lineTotalAmount: 200 },
      { productId: 'p-1', productTitleSnapshot: 'A', quantity: 1, lineTotalAmount: 50 }, // тот же p-1 → агрегируется
      { productId: 'p-3', productTitleSnapshot: 'C', quantity: 1, lineTotalAmount: 300 },
    ]);
    const result = await useCase.execute({ sub: 'u-1' } as any, {
      from: '2026-05-01', to: '2026-05-10',
    });
    expect(result.topProducts).toHaveLength(3);
    // p-3 (300), p-1 (150), p-2 (200) → sorted desc by revenue: p-3, p-2, p-1
    expect(result.topProducts[0]).toEqual(expect.objectContaining({ productId: 'p-3', revenue: 300 }));
    expect(result.topProducts[1]).toEqual(expect.objectContaining({ productId: 'p-2', revenue: 200 }));
    expect(result.topProducts[2]).toEqual(expect.objectContaining({ productId: 'p-1', quantity: 2, revenue: 150 }));
  });

  it('daily buckets заполняются нулями для дней без заказов', async () => {
    prisma.order.findMany.mockResolvedValue([
      { id: 'o-1', status: 'DELIVERED', totalAmount: 100, placedAt: new Date('2026-05-03T10:00:00Z') },
    ]);
    const result = await useCase.execute({ sub: 'u-1' } as any, {
      from: '2026-05-01T00:00:00Z', to: '2026-05-05T00:00:00Z',
    });
    expect(result.daily).toHaveLength(5); // 5 дней
    const may3 = result.daily.find((d) => d.date === '2026-05-03')!;
    expect(may3.revenue).toBe(100);
    expect(may3.orderCount).toBe(1);
    const may1 = result.daily.find((d) => d.date === '2026-05-01')!;
    expect(may1.orderCount).toBe(0);
  });

  it('snapshot product (productId=null) использует productTitleSnapshot как ключ', async () => {
    prisma.orderItem.findMany.mockResolvedValue([
      { productId: null, productTitleSnapshot: 'Deleted', quantity: 1, lineTotalAmount: 50 },
      { productId: null, productTitleSnapshot: 'Deleted', quantity: 2, lineTotalAmount: 100 },
    ]);
    const result = await useCase.execute({ sub: 'u-1' } as any, {
      from: '2026-05-01', to: '2026-05-05',
    });
    expect(result.topProducts).toHaveLength(1);
    expect(result.topProducts[0]).toEqual(expect.objectContaining({
      productId: null,
      title: 'Deleted',
      quantity: 3,
      revenue: 150,
    }));
  });
});
