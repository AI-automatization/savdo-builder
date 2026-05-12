/**
 * Тесты для `MergeGuestCartUseCase`.
 *
 * Сценарий: anonymous юзер добавил товары в guest-корзину (sessionKey),
 * потом залогинился — guest cart мерджится в buyer cart.
 *
 * INV-C01: один store на корзину. При конфликте store — guest wins (это
 * последняя намеренность юзера).
 */
import { MergeGuestCartUseCase } from './merge-guest-cart.use-case';
import { CartRepository } from '../repositories/cart.repository';

const GUEST_CART = {
  id: 'cart-guest',
  storeId: 'store-1',
  items: [{ id: 'item-1', productId: 'p-1', quantity: 2 }],
};

const BUYER_CART = {
  id: 'cart-buyer',
  storeId: 'store-1',
  items: [{ id: 'item-2', productId: 'p-2', quantity: 1 }],
};

describe('MergeGuestCartUseCase', () => {
  let useCase: MergeGuestCartUseCase;
  let cartRepo: {
    findBySessionKey: jest.Mock;
    findByBuyerId: jest.Mock;
    findById: jest.Mock;
    createForBuyer: jest.Mock;
    clearCart: jest.Mock;
    setStoreId: jest.Mock;
    mergeGuestCart: jest.Mock;
  };

  beforeEach(() => {
    cartRepo = {
      findBySessionKey: jest.fn().mockResolvedValue(GUEST_CART),
      findByBuyerId: jest.fn().mockResolvedValue(BUYER_CART),
      findById: jest.fn(),
      createForBuyer: jest.fn().mockResolvedValue({ id: 'cart-new' }),
      clearCart: jest.fn().mockResolvedValue(undefined),
      setStoreId: jest.fn().mockResolvedValue(undefined),
      mergeGuestCart: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new MergeGuestCartUseCase(cartRepo as unknown as CartRepository);
  });

  describe('no-op cases', () => {
    it('guest cart не существует → no-op', async () => {
      cartRepo.findBySessionKey.mockResolvedValue(null);
      await useCase.execute({ sessionKey: 'sess-1', buyerId: 'b-1' });
      expect(cartRepo.findByBuyerId).not.toHaveBeenCalled();
      expect(cartRepo.mergeGuestCart).not.toHaveBeenCalled();
    });

    it('guest cart пустой → no-op', async () => {
      cartRepo.findBySessionKey.mockResolvedValue({ ...GUEST_CART, items: [] });
      await useCase.execute({ sessionKey: 'sess-1', buyerId: 'b-1' });
      expect(cartRepo.findByBuyerId).not.toHaveBeenCalled();
      expect(cartRepo.mergeGuestCart).not.toHaveBeenCalled();
    });
  });

  describe('happy path — same store', () => {
    it('buyer cart существует с тем же store → mergeGuestCart', async () => {
      await useCase.execute({ sessionKey: 'sess-1', buyerId: 'b-1' });
      expect(cartRepo.mergeGuestCart).toHaveBeenCalledWith('cart-guest', 'cart-buyer');
      expect(cartRepo.clearCart).not.toHaveBeenCalled();
      expect(cartRepo.setStoreId).not.toHaveBeenCalled();
    });

    it('buyer cart НЕ существует → createForBuyer с guest store', async () => {
      cartRepo.findByBuyerId.mockResolvedValue(null);
      cartRepo.findById.mockResolvedValue({ id: 'cart-new', storeId: 'store-1', items: [] });
      await useCase.execute({ sessionKey: 'sess-1', buyerId: 'b-1' });
      expect(cartRepo.createForBuyer).toHaveBeenCalledWith('b-1', 'store-1');
      expect(cartRepo.mergeGuestCart).toHaveBeenCalledWith('cart-guest', 'cart-new');
    });

    it('createForBuyer успешно но findById возвращает null → 500', async () => {
      cartRepo.findByBuyerId.mockResolvedValue(null);
      cartRepo.findById.mockResolvedValue(null);
      await expect(useCase.execute({ sessionKey: 'sess-1', buyerId: 'b-1' }))
        .rejects.toThrow(/Failed to resolve buyer cart/);
    });
  });

  describe('INV-C01: store mismatch — guest wins', () => {
    it('buyer cart другой store → clearCart + setStoreId на guest store', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({ ...BUYER_CART, storeId: 'store-DIFFERENT' });
      await useCase.execute({ sessionKey: 'sess-1', buyerId: 'b-1' });
      expect(cartRepo.clearCart).toHaveBeenCalledWith('cart-buyer');
      expect(cartRepo.setStoreId).toHaveBeenCalledWith('cart-buyer', 'store-1');
      expect(cartRepo.mergeGuestCart).toHaveBeenCalledWith('cart-guest', 'cart-buyer');
    });

    it('clearCart → setStoreId → mergeGuestCart порядок', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({ ...BUYER_CART, storeId: 'store-DIFFERENT' });
      const calls: string[] = [];
      cartRepo.clearCart.mockImplementation(async () => { calls.push('clear'); });
      cartRepo.setStoreId.mockImplementation(async () => { calls.push('setStore'); });
      cartRepo.mergeGuestCart.mockImplementation(async () => { calls.push('merge'); });
      await useCase.execute({ sessionKey: 'sess-1', buyerId: 'b-1' });
      expect(calls).toEqual(['clear', 'setStore', 'merge']);
    });
  });
});
