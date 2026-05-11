/**
 * Объединённые тесты: UpdateCartItem + RemoveFromCart + ClearCart.
 *
 * Главное — ownership check (item принадлежит cart) и quantity validation.
 */
import { UpdateCartItemUseCase } from './update-cart-item.use-case';
import { RemoveFromCartUseCase } from './remove-from-cart.use-case';
import { ClearCartUseCase } from './clear-cart.use-case';
import { CartRepository } from '../repositories/cart.repository';

const ITEM = { id: 'item-1', cartId: 'cart-1', productId: 'p-1', quantity: 2, unitPriceSnapshot: 100 };
const CART_FULL = {
  id: 'cart-1',
  storeId: 'store-1',
  currencyCode: 'UZS',
  items: [{ ...ITEM, product: { title: 'iPhone' } }],
};

describe('UpdateCartItemUseCase', () => {
  let useCase: UpdateCartItemUseCase;
  let cartRepo: {
    findItemById: jest.Mock;
    updateItemQuantity: jest.Mock;
    findById: jest.Mock;
  };

  beforeEach(() => {
    cartRepo = {
      findItemById: jest.fn().mockResolvedValue(ITEM),
      updateItemQuantity: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(CART_FULL),
    };
    useCase = new UpdateCartItemUseCase(cartRepo as unknown as CartRepository);
  });

  it('item не найден → CART_ITEM_NOT_FOUND', async () => {
    cartRepo.findItemById.mockResolvedValue(null);
    await expect(useCase.execute({ itemId: 'missing', cartId: 'cart-1', quantity: 5 }))
      .rejects.toThrow(/Cart item not found/);
  });

  it('item принадлежит другому cart → CART_ITEM_NOT_FOUND (защита от cross-buyer access)', async () => {
    cartRepo.findItemById.mockResolvedValue({ ...ITEM, cartId: 'cart-OTHER' });
    await expect(useCase.execute({ itemId: 'item-1', cartId: 'cart-1', quantity: 5 }))
      .rejects.toThrow(/does not belong/);
    expect(cartRepo.updateItemQuantity).not.toHaveBeenCalled();
  });

  it('quantity < 1 → VALIDATION_ERROR', async () => {
    await expect(useCase.execute({ itemId: 'item-1', cartId: 'cart-1', quantity: 0 }))
      .rejects.toThrow(/at least 1/);
    await expect(useCase.execute({ itemId: 'item-1', cartId: 'cart-1', quantity: -5 }))
      .rejects.toThrow(/at least 1/);
  });

  it('happy path → updateItemQuantity + reload mapped cart', async () => {
    const result = await useCase.execute({ itemId: 'item-1', cartId: 'cart-1', quantity: 5 });
    expect(cartRepo.updateItemQuantity).toHaveBeenCalledWith('item-1', 5);
    expect(result.id).toBe('cart-1');
  });
});

describe('RemoveFromCartUseCase', () => {
  let useCase: RemoveFromCartUseCase;
  let cartRepo: {
    findItemById: jest.Mock;
    removeItem: jest.Mock;
    countItems: jest.Mock;
  };

  beforeEach(() => {
    cartRepo = {
      findItemById: jest.fn().mockResolvedValue(ITEM),
      removeItem: jest.fn().mockResolvedValue(undefined),
      countItems: jest.fn().mockResolvedValue(2),
    };
    useCase = new RemoveFromCartUseCase(cartRepo as unknown as CartRepository);
  });

  it('item не найден → 404', async () => {
    cartRepo.findItemById.mockResolvedValue(null);
    await expect(useCase.execute({ itemId: 'missing', cartId: 'cart-1' }))
      .rejects.toThrow(/Cart item not found/);
  });

  it('item чужой cart → 404 (защита)', async () => {
    cartRepo.findItemById.mockResolvedValue({ ...ITEM, cartId: 'cart-OTHER' });
    await expect(useCase.execute({ itemId: 'item-1', cartId: 'cart-1' }))
      .rejects.toThrow(/does not belong/);
    expect(cartRepo.removeItem).not.toHaveBeenCalled();
  });

  it('happy path → removeItem + countItems проверяет остатки', async () => {
    await useCase.execute({ itemId: 'item-1', cartId: 'cart-1' });
    expect(cartRepo.removeItem).toHaveBeenCalledWith('item-1');
    expect(cartRepo.countItems).toHaveBeenCalledWith('cart-1');
  });

  it('последний item → countItems=0 (cart остаётся, storeId сохраняется по schema constraint)', async () => {
    cartRepo.countItems.mockResolvedValue(0);
    await useCase.execute({ itemId: 'item-1', cartId: 'cart-1' });
    // Cart НЕ удаляется и storeId не сбрасывается (storeId required в schema).
    // CheckoutModule отдельно проверяет на пустоту.
    expect(cartRepo.removeItem).toHaveBeenCalled();
  });
});

describe('ClearCartUseCase', () => {
  let useCase: ClearCartUseCase;
  let cartRepo: {
    findByBuyerId: jest.Mock;
    findBySessionKey: jest.Mock;
    clearCart: jest.Mock;
  };

  beforeEach(() => {
    cartRepo = {
      findByBuyerId: jest.fn().mockResolvedValue({ id: 'cart-1' }),
      findBySessionKey: jest.fn().mockResolvedValue({ id: 'cart-2' }),
      clearCart: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ClearCartUseCase(cartRepo as unknown as CartRepository);
  });

  it('buyerId → findByBuyerId + clearCart(cart.id)', async () => {
    await useCase.execute({ buyerId: 'b-1' });
    expect(cartRepo.findByBuyerId).toHaveBeenCalledWith('b-1');
    expect(cartRepo.clearCart).toHaveBeenCalledWith('cart-1');
  });

  it('sessionKey → findBySessionKey + clearCart', async () => {
    await useCase.execute({ sessionKey: 'sess-1' });
    expect(cartRepo.findBySessionKey).toHaveBeenCalledWith('sess-1');
    expect(cartRepo.clearCart).toHaveBeenCalledWith('cart-2');
  });

  it('no cart → no-op (не падает)', async () => {
    cartRepo.findByBuyerId.mockResolvedValue(null);
    await useCase.execute({ buyerId: 'b-1' });
    expect(cartRepo.clearCart).not.toHaveBeenCalled();
  });

  it('ни buyerId ни sessionKey → no-op', async () => {
    await useCase.execute({});
    expect(cartRepo.findByBuyerId).not.toHaveBeenCalled();
    expect(cartRepo.findBySessionKey).not.toHaveBeenCalled();
    expect(cartRepo.clearCart).not.toHaveBeenCalled();
  });
});
