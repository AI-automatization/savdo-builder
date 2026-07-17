import { AdminPurgeStoreUseCase } from './admin-purge-store.use-case';
import { DomainException } from '../../../common/exceptions/domain.exception';

const STORE = { id: 'st-1', slug: 'shop', name: 'Shop', sellerId: 's-1' };

function makeTx() {
  const model = () => ({
    deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
    delete: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([{ id: 'p-1' }, { id: 'p-2' }]),
  });
  return {
    chatMessage: model(), chatThread: model(),
    moderationCase: model(), moderationAction: model(),
    orderStatusHistory: model(), orderRefund: model(), order: model(), cart: model(),
    inventoryMovement: model(), productVariantOptionValue: model(), productVariant: model(),
    productOptionValue: model(), productOptionGroup: model(), product: model(),
    storeContact: model(), storeDeliverySettings: model(), storeCategory: model(),
    partnerApiKey: model(), store: model(), auditLog: model(),
  };
}

function makeUseCase(found: any) {
  const tx = makeTx();
  const prisma = {
    store: { findUnique: jest.fn().mockResolvedValue(found) },
    $transaction: jest.fn(async (cb: any) => cb(tx)),
  };
  return { useCase: new AdminPurgeStoreUseCase(prisma as any), prisma, tx };
}

describe('AdminPurgeStoreUseCase (ADMIN-STORE-PURGE-001)', () => {
  it('несуществующий магазин — 404', async () => {
    const { useCase } = makeUseCase(null);
    await expect(
      useCase.execute({ storeId: 'nope', actorUserId: 'admin-1', confirmSlug: 'x' }),
    ).rejects.toThrow(DomainException);
  });

  it('неверный confirmSlug — 422, транзакция не стартует', async () => {
    const { useCase, prisma } = makeUseCase(STORE);
    await expect(
      useCase.execute({ storeId: 'st-1', actorUserId: 'admin-1', confirmSlug: 'wrong' }),
    ).rejects.toThrow(/confirmSlug/);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('полный purge: заказы/товары/периферия/store + модерация store и товаров + audit', async () => {
    const { useCase, tx } = makeUseCase(STORE);
    const res = await useCase.execute({
      storeId: 'st-1', actorUserId: 'admin-1', confirmSlug: 'shop',
    });

    // ChatThread.productId/orderId — Restrict-FK: чаты продавца обязаны
    // удаляться ДО товаров/заказов, иначе P2003 (ревью FIX-FIRST 17.07).
    expect(tx.chatMessage.deleteMany).toHaveBeenCalledWith({
      where: { thread: { sellerId: 's-1' } },
    });
    expect(tx.chatThread.deleteMany).toHaveBeenCalledWith({
      where: { sellerId: 's-1' },
    });
    // Сироты модерации: store + все товары магазина.
    expect(tx.moderationCase.deleteMany).toHaveBeenCalledWith({
      where: { entityId: { in: ['st-1', 'p-1', 'p-2'] } },
    });
    expect(tx.order.deleteMany).toHaveBeenCalledWith({ where: { storeId: 'st-1' } });
    expect(tx.product.deleteMany).toHaveBeenCalledWith({ where: { storeId: 'st-1' } });
    expect(tx.partnerApiKey.deleteMany).toHaveBeenCalledWith({ where: { storeId: 'st-1' } });
    expect(tx.store.delete).toHaveBeenCalledWith({ where: { id: 'st-1' } });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'STORE_HARD_DELETED', actorUserId: 'admin-1' }),
      }),
    );
    expect(res.purged).toBe(true);
    expect(res.slug).toBe('shop');
  });
});
