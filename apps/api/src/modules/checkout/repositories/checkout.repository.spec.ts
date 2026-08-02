/**
 * Тесты для `CheckoutRepository.createOrder` — TEST-CORE-001.
 *
 * INV-O04 (forward): stock списывается атомарно при создании заказа.
 * API-STOCK-RACE-OVERSELL-001: guard `stockQuantity >= qty` в самом UPDATE —
 * при 0 затронутых строк заказ падает CHECKOUT_STOCK_INSUFFICIENT.
 * API-CHECKOUT-CONFIRM-500-001: невалидный UUID отсекается ДО raw SQL.
 */
import { CheckoutRepository, CreateOrderData } from './checkout.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { PrismaService } from '../../../database/prisma.service';

const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
const VARIANT_ID = '22222222-2222-2222-2222-222222222222';

function makeTx() {
  return {
    order: { create: jest.fn().mockResolvedValue({ id: 'ord-1', status: 'PENDING' }) },
    orderItem: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    inventoryMovement: { create: jest.fn().mockResolvedValue({}) },
    product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    $executeRaw: jest.fn().mockResolvedValue(1),
  };
}

function makeRepo() {
  const tx = makeTx();
  const prisma = {
    $transaction: jest.fn(async (cb: (t: unknown) => unknown) => cb(tx)),
  };
  return { repo: new CheckoutRepository(prisma as unknown as PrismaService), tx };
}

function baseOrderData(items: CreateOrderData['items']): CreateOrderData {
  return {
    buyerId: 'b-1',
    storeId: 'st-1',
    sellerId: 's-1',
    cartId: 'cart-1',
    orderNumber: 'ORD-TEST-1',
    subtotalAmount: 100_000,
    deliveryFeeAmount: 0,
    totalAmount: 100_000,
    currencyCode: 'UZS',
    customerFullName: 'Test Buyer',
    customerPhone: '+998901234567',
    items,
  };
}

const variantItem = {
  productId: PRODUCT_ID,
  variantId: VARIANT_ID,
  productTitleSnapshot: 'Товар',
  unitPriceSnapshot: 50_000,
  quantity: 2,
  lineTotalAmount: 100_000,
};

const simpleItem = {
  productId: PRODUCT_ID,
  productTitleSnapshot: 'Товар без вариантов',
  unitPriceSnapshot: 100_000,
  quantity: 1,
  lineTotalAmount: 100_000,
};

describe('CheckoutRepository.createOrder (INV-O04 + API-STOCK-RACE-OVERSELL-001)', () => {
  it('happy-path (variant): заказ + items + history(null→PENDING) + движение ORDER_DEDUCTED', async () => {
    const { repo, tx } = makeRepo();
    const order = await repo.createOrder(baseOrderData([variantItem]));

    expect(order.id).toBe('ord-1');
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', orderNumber: 'ORD-TEST-1' }) }),
    );
    expect(tx.orderItem.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          orderId: 'ord-1',
          productId: PRODUCT_ID,
          variantId: VARIANT_ID,
          unitPriceSnapshot: 50_000,
          quantity: 2,
        }),
      ],
    });
    expect(tx.orderStatusHistory.create).toHaveBeenCalledWith({
      data: { orderId: 'ord-1', oldStatus: null, newStatus: 'PENDING' },
    });
    // Атомарное списание через raw UPDATE с guard'ом
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: PRODUCT_ID,
        variantId: VARIANT_ID,
        movementType: 'ORDER_DEDUCTED',
        quantityDelta: -2,
        referenceType: 'order',
        referenceId: 'ord-1',
      }),
    });
  });

  it('oversell (variant): UPDATE затронул 0 строк → CHECKOUT_STOCK_INSUFFICIENT, движение не пишется', async () => {
    const { repo, tx } = makeRepo();
    tx.$executeRaw.mockResolvedValue(0);

    await expect(repo.createOrder(baseOrderData([variantItem]))).rejects.toThrow(DomainException);
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('happy-path (без варианта): totalStock decrement через updateMany с gte-guard + движение', async () => {
    const { repo, tx } = makeRepo();
    await repo.createOrder(baseOrderData([simpleItem]));

    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: PRODUCT_ID, totalStock: { gte: 1 } },
      data: { totalStock: { decrement: 1 } },
    });
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ variantId: null, movementType: 'ORDER_DEDUCTED', quantityDelta: -1 }),
    });
  });

  it('oversell (без варианта): count=0 → CHECKOUT_STOCK_INSUFFICIENT', async () => {
    const { repo, tx } = makeRepo();
    tx.product.updateMany.mockResolvedValue({ count: 0 });

    await expect(repo.createOrder(baseOrderData([simpleItem]))).rejects.toThrow(/Insufficient stock/);
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('невалидный variantId (не UUID) → отказ ДО raw SQL (API-CHECKOUT-CONFIRM-500-001)', async () => {
    const { repo, tx } = makeRepo();
    const bad = { ...variantItem, variantId: 'not-a-uuid' };

    await expect(repo.createOrder(baseOrderData([bad]))).rejects.toThrow(DomainException);
    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });

  it('невалидный productId (не UUID) → отказ до списания', async () => {
    const { repo, tx } = makeRepo();
    const bad = { ...simpleItem, productId: 'legacy-id-123' };

    await expect(repo.createOrder(baseOrderData([bad]))).rejects.toThrow(DomainException);
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });

  it('второй item падает по stock → исключение пробрасывается из транзакции (rollback на стороне Prisma)', async () => {
    const { repo, tx } = makeRepo();
    tx.$executeRaw
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    const secondVariant = { ...variantItem, variantId: '33333333-3333-3333-3333-333333333333' };

    await expect(
      repo.createOrder(baseOrderData([variantItem, secondVariant])),
    ).rejects.toThrow(/Insufficient stock/);
    // Первое движение успело записаться внутри tx — откат делает $transaction
    expect(tx.inventoryMovement.create).toHaveBeenCalledTimes(1);
  });
});
