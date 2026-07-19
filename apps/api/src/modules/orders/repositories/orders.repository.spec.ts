/**
 * Тесты для `OrdersRepository.updateStatus` — TEST-CORE-001.
 *
 * INV-O04 (обратная сторона): stock ВОССТАНАВЛИВАЕТСЯ при отмене заказа
 * из активного статуса (PENDING/CONFIRMED/PROCESSING → CANCELLED) +
 * пишется InventoryMovement ORDER_RELEASED. Другие переходы stock не трогают.
 */
import { OrdersRepository } from './orders.repository';
import { PrismaService } from '../../../database/prisma.service';
import { OrderStatus } from '@prisma/client';

function makeTx() {
  return {
    order: { update: jest.fn().mockResolvedValue({ id: 'ord-1', status: 'CANCELLED' }) },
    orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    orderItem: {
      findMany: jest.fn().mockResolvedValue([
        { productId: 'p-1', variantId: 'v-1', quantity: 2 },
        { productId: 'p-2', variantId: 'v-2', quantity: 1 },
      ]),
    },
    productVariant: { update: jest.fn().mockResolvedValue({}) },
    inventoryMovement: { create: jest.fn().mockResolvedValue({}) },
  };
}

function makeRepo() {
  const tx = makeTx();
  const prisma = {
    $transaction: jest.fn(async (cb: (t: unknown) => unknown) => cb(tx)),
  };
  return { repo: new OrdersRepository(prisma as unknown as PrismaService), tx };
}

describe('OrdersRepository.updateStatus (INV-O04 restock on cancel)', () => {
  it.each([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING])(
    '%s → CANCELLED: инкремент stock по каждому варианту + ORDER_RELEASED',
    async (oldStatus) => {
      const { repo, tx } = makeRepo();
      await repo.updateStatus('ord-1', {
        newStatus: OrderStatus.CANCELLED,
        oldStatus,
        reason: 'buyer changed mind',
      });

      expect(tx.productVariant.update).toHaveBeenCalledTimes(2);
      expect(tx.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v-1' },
        data: { stockQuantity: { increment: 2 } },
      });
      expect(tx.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v-2' },
        data: { stockQuantity: { increment: 1 } },
      });
      expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          variantId: 'v-1',
          movementType: 'ORDER_RELEASED',
          quantityDelta: 2,
          referenceType: 'order',
          referenceId: 'ord-1',
        }),
      });
    },
  );

  it('история статусов пишется с oldStatus/newStatus/comment', async () => {
    const { repo, tx } = makeRepo();
    await repo.updateStatus('ord-1', {
      newStatus: OrderStatus.CANCELLED,
      oldStatus: OrderStatus.PENDING,
      reason: 'out of stock',
      changedByUserId: 'user-9',
    });

    expect(tx.orderStatusHistory.create).toHaveBeenCalledWith({
      data: {
        orderId: 'ord-1',
        oldStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.CANCELLED,
        changedByUserId: 'user-9',
        comment: 'out of stock',
      },
    });
  });

  it('обычный переход (PENDING → CONFIRMED) — stock НЕ трогается', async () => {
    const { repo, tx } = makeRepo();
    await repo.updateStatus('ord-1', {
      newStatus: OrderStatus.CONFIRMED,
      oldStatus: OrderStatus.PENDING,
    });

    expect(tx.orderItem.findMany).not.toHaveBeenCalled();
    expect(tx.productVariant.update).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('SHIPPED → CANCELLED (не активный old) — restock НЕ делается (это зона RefundOrderUseCase)', async () => {
    const { repo, tx } = makeRepo();
    await repo.updateStatus('ord-1', {
      newStatus: OrderStatus.CANCELLED,
      oldStatus: OrderStatus.SHIPPED,
    });

    expect(tx.productVariant.update).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('items с null variantId/productId пропускаются (guard)', async () => {
    const { repo, tx } = makeRepo();
    tx.orderItem.findMany.mockResolvedValue([
      { productId: null, variantId: 'v-1', quantity: 2 },
      { productId: 'p-2', variantId: null, quantity: 1 },
    ]);
    await repo.updateStatus('ord-1', {
      newStatus: OrderStatus.CANCELLED,
      oldStatus: OrderStatus.PENDING,
    });

    expect(tx.productVariant.update).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });
});
