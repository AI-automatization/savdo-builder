import { AdminPurgeUserUseCase } from './admin-purge-user.use-case';
import { DomainException } from '../../../common/exceptions/domain.exception';

const USER = {
  id: 'u-1',
  phone: '+998901112233',
  admin: null as any,
  buyer: { id: 'b-1' },
  seller: { id: 's-1', store: { id: 'st-1', slug: 'shop' } },
};

function makeTx() {
  const model = () => ({
    deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    delete: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  });
  return {
    chatMessage: model(), chatThread: model(),
    orderStatusHistory: model(), orderRefund: model(), order: model(), cart: model(),
    inventoryMovement: model(), productVariantOptionValue: model(), productVariant: model(),
    productOptionValue: model(), productOptionGroup: model(), product: model(),
    storeContact: model(), storeDeliverySettings: model(), storeCategory: model(),
    partnerApiKey: model(), store: model(),
    subscriptionPayment: model(), subscription: model(), sellerVerificationDocument: model(),
    seller: model(), auditLog: model(), buyer: model(), user: model(),
    moderationCase: model(), moderationAction: model(),
  };
}

function makeUseCase(found: any) {
  const tx = makeTx();
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(found) },
    $transaction: jest.fn(async (cb: any) => cb(tx)),
  };
  return { useCase: new AdminPurgeUserUseCase(prisma as any), prisma, tx };
}

describe('AdminPurgeUserUseCase (ADMIN-USER-PURGE-001)', () => {
  it('нельзя удалить самого себя', async () => {
    const { useCase } = makeUseCase(USER);
    await expect(
      useCase.execute({ userId: 'u-1', actorUserId: 'u-1', confirmPhone: USER.phone }),
    ).rejects.toThrow(DomainException);
  });

  it('нельзя удалить аккаунт с AdminUser-записью', async () => {
    const { useCase } = makeUseCase({ ...USER, admin: { id: 'a-1' } });
    await expect(
      useCase.execute({ userId: 'u-1', actorUserId: 'admin-1', confirmPhone: USER.phone }),
    ).rejects.toThrow(/AdminUser record/);
  });

  it('неверный confirmPhone — 422, транзакция не стартует', async () => {
    const { useCase, prisma } = makeUseCase(USER);
    await expect(
      useCase.execute({ userId: 'u-1', actorUserId: 'admin-1', confirmPhone: '+998000000000' }),
    ).rejects.toThrow(/confirmPhone/);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('полный purge продавца: store/products/orders/seller/buyer/user удалены + audit', async () => {
    const { useCase, tx } = makeUseCase(USER);
    const res = await useCase.execute({
      userId: 'u-1', actorUserId: 'admin-1', confirmPhone: USER.phone,
    });

    expect(tx.chatMessage.deleteMany).toHaveBeenCalled();
    expect(tx.order.deleteMany).toHaveBeenCalledWith({ where: { storeId: 'st-1' } });
    expect(tx.product.deleteMany).toHaveBeenCalledWith({ where: { storeId: 'st-1' } });
    expect(tx.partnerApiKey.deleteMany).toHaveBeenCalledWith({ where: { storeId: 'st-1' } });
    expect(tx.store.delete).toHaveBeenCalledWith({ where: { id: 'st-1' } });
    expect(tx.seller.delete).toHaveBeenCalledWith({ where: { id: 's-1' } });
    // Заказы юзера-как-покупателя в чужих магазинах НЕ удаляются — отвязка.
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { buyerId: 'b-1' }, data: { buyerId: null },
    });
    expect(tx.buyer.delete).toHaveBeenCalledWith({ where: { id: 'b-1' } });
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'u-1' } });
    // Сироты модерации: user/seller-уровень + store-уровень (внутри subtree).
    expect(tx.moderationCase.deleteMany).toHaveBeenCalledWith({
      where: { entityId: { in: ['u-1', 's-1'] } },
    });
    expect(tx.moderationCase.deleteMany).toHaveBeenCalledWith({
      where: { entityId: { in: ['st-1'] } },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'USER_HARD_DELETED', actorUserId: 'admin-1' }),
      }),
    );
    expect(res.purged).toBe(true);
  });

  it('buyer-only аккаунт: seller/store-ветка не трогается', async () => {
    const { useCase, tx } = makeUseCase({ ...USER, seller: null });
    await useCase.execute({ userId: 'u-1', actorUserId: 'admin-1', confirmPhone: USER.phone });
    expect(tx.store.delete).not.toHaveBeenCalled();
    expect(tx.seller.delete).not.toHaveBeenCalled();
    expect(tx.user.delete).toHaveBeenCalled();
  });
});
