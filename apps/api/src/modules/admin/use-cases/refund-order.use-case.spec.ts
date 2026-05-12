/**
 * Тесты для `RefundOrderUseCase`.
 * Финансовая логика — критично что инварианты держатся:
 *   - reason обязателен (audit trail)
 *   - refund только для refundable статусов (нельзя CANCELLED/PENDING)
 *   - amount в пределах (0, orderTotal]
 *   - сумма всех refund'ов <= orderTotal (защита от двойного возврата)
 *   - full refund → order CANCELLED + paymentStatus REFUNDED
 *   - partial refund → статус не трогается
 */
import { RefundOrderUseCase } from './refund-order.use-case';
import { PrismaService } from '../../../database/prisma.service';

describe('RefundOrderUseCase', () => {
  let useCase: RefundOrderUseCase;
  let prisma: {
    order: { findUnique: jest.Mock; update: jest.Mock };
    orderRefund: { findMany: jest.Mock; create: jest.Mock };
    // INV-O04 stock release deps:
    orderItem: { findMany: jest.Mock };
    productVariant: { update: jest.Mock };
    inventoryMovement: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      orderRefund: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      // INV-O04: при full refund use-case делает orderItem.findMany +
      // productVariant.update + inventoryMovement.create. Default empty
      // items list — для частичных refund'ов код этот блок не выполняет.
      orderItem: { findMany: jest.fn().mockResolvedValue([]) },
      productVariant: { update: jest.fn().mockResolvedValue(undefined) },
      inventoryMovement: { create: jest.fn().mockResolvedValue(undefined) },
      // $transaction(callback) — синхронно выполняем callback с tx=prisma
      $transaction: jest.fn().mockImplementation(async (cb) => cb(prisma)),
    };
    useCase = new RefundOrderUseCase(prisma as unknown as PrismaService);
  });

  function setOrder(overrides: Partial<{ totalAmount: number; status: string; paymentStatus: string }> = {}) {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      totalAmount: '1000',
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      ...overrides,
    });
  }

  describe('validation', () => {
    it('БРОСАЕТ если reason пустой', async () => {
      await expect(
        useCase.execute({ adminId: 'a1', orderId: 'o1', reason: '' }),
      ).rejects.toThrow(/reason is required/);
    });

    it('БРОСАЕТ если reason — только пробелы', async () => {
      await expect(
        useCase.execute({ adminId: 'a1', orderId: 'o1', reason: '   ' }),
      ).rejects.toThrow(/reason is required/);
    });

    it('БРОСАЕТ 404 если order не найден', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(
        useCase.execute({ adminId: 'a1', orderId: 'unknown', reason: 'fraud' }),
      ).rejects.toThrow(/Order not found/);
    });
  });

  describe('refundable status invariant', () => {
    const allowed = ['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PROCESSING'];
    const forbidden = ['PENDING', 'CANCELLED'];

    allowed.forEach((status) => {
      it(`разрешён для ${status}`, async () => {
        setOrder({ status });
        prisma.orderRefund.create.mockResolvedValue({
          id: 'r1', orderId: 'o1', amount: '1000', reason: 'fraud', createdAt: new Date(),
        });
        await expect(
          useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'fraud' }),
        ).resolves.toBeDefined();
      });
    });

    forbidden.forEach((status) => {
      it(`БРОСАЕТ для ${status}`, async () => {
        setOrder({ status });
        await expect(
          useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'fraud' }),
        ).rejects.toThrow(/Cannot refund order in status/);
      });
    });
  });

  describe('amount validation', () => {
    beforeEach(() => setOrder({ totalAmount: 1000 }));

    it('default amount = orderTotal (full refund)', async () => {
      prisma.orderRefund.create.mockResolvedValue({
        id: 'r1', orderId: 'o1', amount: '1000', reason: 'x', createdAt: new Date(),
      });
      const res = await useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'x' });
      expect(res.amount).toBe(1000);
      expect(res.isFullRefund).toBe(true);
    });

    it('БРОСАЕТ если amount=0', async () => {
      await expect(
        useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'x', amount: 0 }),
      ).rejects.toThrow(/amount must be/);
    });

    it('БРОСАЕТ если amount отрицательный', async () => {
      await expect(
        useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'x', amount: -100 }),
      ).rejects.toThrow(/amount must be/);
    });

    it('БРОСАЕТ если amount > orderTotal', async () => {
      await expect(
        useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'x', amount: 1500 }),
      ).rejects.toThrow(/amount must be/);
    });

    it('разрешён partial refund', async () => {
      prisma.orderRefund.create.mockResolvedValue({
        id: 'r1', orderId: 'o1', amount: '300', reason: 'x', createdAt: new Date(),
      });
      const res = await useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'x', amount: 300 });
      expect(res.amount).toBe(300);
      expect(res.isFullRefund).toBe(false);
    });
  });

  describe('double-refund protection', () => {
    it('запрещает refund если уже было refund'.replace("'", "") + ' на полную сумму', async () => {
      setOrder({ totalAmount: 1000 });
      prisma.orderRefund.findMany.mockResolvedValue([{ amount: '1000' }]);
      await expect(
        useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'x', amount: 100 }),
      ).rejects.toThrow(/Already refunded 1000 of 1000/);
    });

    it('разрешает оставшуюся часть после partial refund', async () => {
      setOrder({ totalAmount: 1000 });
      prisma.orderRefund.findMany.mockResolvedValue([{ amount: '300' }]);
      prisma.orderRefund.create.mockResolvedValue({
        id: 'r2', orderId: 'o1', amount: '700', reason: 'x', createdAt: new Date(),
      });
      const res = await useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'x', amount: 700 });
      expect(res.isFullRefund).toBe(true);
      expect(res.remainingAfter).toBe(0);
    });

    it('запрещает превышение остатка', async () => {
      setOrder({ totalAmount: 1000 });
      prisma.orderRefund.findMany.mockResolvedValue([{ amount: '300' }]);
      await expect(
        useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'x', amount: 800 }),
      ).rejects.toThrow(/Already refunded 300 of 1000. Remaining: 700/);
    });
  });

  describe('full refund effects', () => {
    beforeEach(() => {
      setOrder({ totalAmount: 1000 });
      prisma.orderRefund.create.mockResolvedValue({
        id: 'r1', orderId: 'o1', amount: '1000', reason: 'x', createdAt: new Date(),
      });
    });

    it('меняет order.status на CANCELLED + paymentStatus REFUNDED', async () => {
      await useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'fraud' });
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'o1' },
          data: expect.objectContaining({
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED',
            cancelReason: 'REFUND: fraud',
          }),
        }),
      );
    });
  });

  describe('partial refund — НЕ трогает order status', () => {
    beforeEach(() => {
      setOrder({ totalAmount: 1000 });
      prisma.orderRefund.create.mockResolvedValue({
        id: 'r1', orderId: 'o1', amount: '300', reason: 'x', createdAt: new Date(),
      });
    });

    it('order.update НЕ вызывается', async () => {
      await useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'partial', amount: 300 });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('INV-O04 stock release (full refund)', () => {
    beforeEach(() => {
      setOrder({ totalAmount: 1000 });
      prisma.orderRefund.create.mockResolvedValue({
        id: 'r1', orderId: 'o1', amount: '1000', reason: 'fraud', createdAt: new Date(),
      });
    });

    it('full refund возвращает stock на каждый OrderItem с variantId', async () => {
      prisma.orderItem.findMany.mockResolvedValue([
        { productId: 'p-1', variantId: 'v-1', quantity: 3 },
        { productId: 'p-2', variantId: 'v-2', quantity: 1 },
      ]);
      await useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'fraud' });

      expect(prisma.orderItem.findMany).toHaveBeenCalledWith({
        where: { orderId: 'o1', variantId: { not: null }, productId: { not: null } },
        select: { productId: true, variantId: true, quantity: true },
      });
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v-1' },
        data: { stockQuantity: { increment: 3 } },
      });
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v-2' },
        data: { stockQuantity: { increment: 1 } },
      });
      expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(2);
    });

    it('partial refund НЕ возвращает stock', async () => {
      prisma.orderItem.findMany.mockResolvedValue([{ productId: 'p-1', variantId: 'v-1', quantity: 3 }]);
      await useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'partial', amount: 300 });
      expect(prisma.productVariant.update).not.toHaveBeenCalled();
      expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    });

    it('order без variants → no-op (digital product)', async () => {
      prisma.orderItem.findMany.mockResolvedValue([]);
      await useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'r' });
      expect(prisma.productVariant.update).not.toHaveBeenCalled();
    });
  });

  describe('audit trail', () => {
    it('reason обрезается trim() и записывается в refund', async () => {
      setOrder({ totalAmount: 1000 });
      prisma.orderRefund.create.mockResolvedValue({
        id: 'r1', orderId: 'o1', amount: '1000', reason: 'fraud', createdAt: new Date(),
      });
      await useCase.execute({ adminId: 'a1', orderId: 'o1', reason: '  fraud  ', notes: '  some notes  ' });
      expect(prisma.orderRefund.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reason: 'fraud',
            notes: 'some notes',
            adminId: 'a1',
            status: 'COMPLETED',
          }),
        }),
      );
    });

    it('notes default = null если не передан', async () => {
      setOrder({ totalAmount: 1000 });
      prisma.orderRefund.create.mockResolvedValue({
        id: 'r1', orderId: 'o1', amount: '1000', reason: 'x', createdAt: new Date(),
      });
      await useCase.execute({ adminId: 'a1', orderId: 'o1', reason: 'x' });
      expect(prisma.orderRefund.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ notes: null }),
        }),
      );
    });
  });
});
