/**
 * Тесты для `ActivateSellerOnMarketUseCase`.
 * Безопасность: один endpoint объединяет 3 действия (создание seller + store +
 * approve). Если orchestration сломан — admin может непреднамеренно создать
 * seller без store, или store без approve, оставив систему в невалидном
 * состоянии. Audit log должен быть единым.
 */
import { ActivateSellerOnMarketUseCase } from './activate-seller-on-market.use-case';
import { AdminCreateSellerUseCase } from './admin-create-seller.use-case';
import { AdminCreateStoreUseCase } from './admin-create-store.use-case';
import { ApproveStoreUseCase } from './approve-store.use-case';
import { AdminRepository } from '../repositories/admin.repository';

describe('ActivateSellerOnMarketUseCase', () => {
  let useCase: ActivateSellerOnMarketUseCase;
  let createSeller: jest.Mocked<AdminCreateSellerUseCase>;
  let createStore: jest.Mocked<AdminCreateStoreUseCase>;
  let approveStore: jest.Mocked<ApproveStoreUseCase>;
  let adminRepo: jest.Mocked<AdminRepository>;

  const SELLER = { id: 'seller-1', userId: 'u-1', fullName: 'Test Seller' };
  const STORE = { id: 'store-1', sellerId: 'seller-1', name: 'My Store' };
  const APPROVED_STORE = { id: 'store-1', sellerId: 'seller-1', name: 'My Store', status: 'ACTIVE', slug: 'my-store' };

  const VALID_INPUT = {
    actorUserId: 'admin-1',
    targetUserId: 'u-1',
    fullName: 'Test Seller',
    sellerType: 'individual' as const,
    telegramUsername: 'test_seller',
    storeName: 'My Store',
    storeCity: 'Tashkent',
    telegramContactLink: 'https://t.me/test_seller',
  };

  beforeEach(() => {
    createSeller = {
      execute: jest.fn().mockResolvedValue(SELLER as never),
    } as unknown as jest.Mocked<AdminCreateSellerUseCase>;

    createStore = {
      execute: jest.fn().mockResolvedValue(STORE as never),
    } as unknown as jest.Mocked<AdminCreateStoreUseCase>;

    approveStore = {
      execute: jest.fn().mockResolvedValue(APPROVED_STORE as never),
    } as unknown as jest.Mocked<ApproveStoreUseCase>;

    adminRepo = {
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AdminRepository>;

    useCase = new ActivateSellerOnMarketUseCase(createSeller, createStore, approveStore, adminRepo);
  });

  describe('happy path — 3 шага в правильном порядке', () => {
    it('вызывает make-seller с правильными данными', async () => {
      await useCase.execute(VALID_INPUT);
      expect(createSeller.execute).toHaveBeenCalledWith({
        userId: 'u-1',
        fullName: 'Test Seller',
        sellerType: 'individual',
        telegramUsername: 'test_seller',
      });
    });

    it('создаёт store ПОСЛЕ seller с правильными данными', async () => {
      await useCase.execute(VALID_INPUT);
      expect(createStore.execute).toHaveBeenCalledWith({
        sellerId: 'seller-1', // взято из созданного seller
        name: 'My Store',
        city: 'Tashkent',
        telegramContactLink: 'https://t.me/test_seller',
        description: undefined,
        region: undefined,
        slug: undefined,
      });
    });

    it('approve store ПОСЛЕ создания + actorUserId передаётся (audit trail в approve)', async () => {
      await useCase.execute(VALID_INPUT);
      expect(approveStore.execute).toHaveBeenCalledWith('store-1', 'admin-1');
    });

    it('пишет единую audit-запись с полным контекстом', async () => {
      await useCase.execute(VALID_INPUT);
      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
        actorUserId: 'admin-1',
        action: 'seller.activated_on_market',
        entityType: 'user',
        entityId: 'u-1',
        payload: {
          sellerId: 'seller-1',
          storeId: 'store-1',
          storeSlug: 'my-store',
          storeName: 'My Store',
        },
      });
    });

    it('возвращает seller + approved store', async () => {
      const result = await useCase.execute(VALID_INPUT);
      expect(result).toEqual({ seller: SELLER, store: APPROVED_STORE });
    });
  });

  describe('передача опциональных полей', () => {
    it('description/region/slug пробрасываются в createStore', async () => {
      await useCase.execute({
        ...VALID_INPUT,
        description: 'Best store ever',
        region: 'Tashkent',
        slug: 'my-custom-slug',
      });
      expect(createStore.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Best store ever',
          region: 'Tashkent',
          slug: 'my-custom-slug',
        }),
      );
    });
  });

  describe('error propagation — НЕ должен оставлять систему в полу-готовом состоянии без audit', () => {
    it('если make-seller упал — store не создаётся, audit не пишется', async () => {
      createSeller.execute.mockRejectedValue(new Error('seller already exists'));
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow('seller already exists');
      expect(createStore.execute).not.toHaveBeenCalled();
      expect(approveStore.execute).not.toHaveBeenCalled();
      expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
    });

    it('если create-store упал — approve не вызывается, audit не пишется', async () => {
      createStore.execute.mockRejectedValue(new Error('store already exists'));
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow('store already exists');
      expect(approveStore.execute).not.toHaveBeenCalled();
      expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
    });

    it('если approve упал — audit НЕ пишется (idempotency: повторный вызов получит CONFLICT на seller)', async () => {
      approveStore.execute.mockRejectedValue(new Error('store invalid transition'));
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow('store invalid transition');
      expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
    });
  });

  describe('audit-log invariant (INV-A01)', () => {
    it('audit пишется ВСЕГДА когда все 3 шага прошли', async () => {
      await useCase.execute(VALID_INPUT);
      expect(adminRepo.writeAuditLog).toHaveBeenCalledTimes(1);
    });

    it('action именно `seller.activated_on_market` (фиксированный для отличения от make-seller)', async () => {
      await useCase.execute(VALID_INPUT);
      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'seller.activated_on_market' }),
      );
    });

    it('actorUserId — это admin (НЕ target user)', async () => {
      await useCase.execute(VALID_INPUT);
      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ actorUserId: 'admin-1', entityId: 'u-1' }),
      );
    });
  });

  describe('order-of-execution — критично для idempotency', () => {
    it('seller создаётся ДО store (нужен sellerId)', async () => {
      const callOrder: string[] = [];
      createSeller.execute.mockImplementation(async () => { callOrder.push('seller'); return SELLER as never; });
      createStore.execute.mockImplementation(async () => { callOrder.push('store'); return STORE as never; });
      approveStore.execute.mockImplementation(async () => { callOrder.push('approve'); return APPROVED_STORE as never; });

      await useCase.execute(VALID_INPUT);
      expect(callOrder).toEqual(['seller', 'store', 'approve']);
    });
  });
});
