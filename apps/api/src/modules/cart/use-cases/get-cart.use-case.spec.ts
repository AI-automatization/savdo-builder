/**
 * Тесты для `GetCartUseCase` + `mapCart` (mapper покрывается через use-case).
 *
 * Ключевое:
 *   - buyerId vs sessionKey resolution
 *   - empty cart shape (id=null, storeId=null, items=[])
 *   - salePriceSnapshot имеет приоритет над unitPriceSnapshot
 *   - subtotal = unitPrice × quantity, totalAmount = Σ subtotal
 *   - variant.titleOverride или optionValues join
 */
import { GetCartUseCase } from './get-cart.use-case';
import { CartRepository } from '../repositories/cart.repository';

const PRODUCT = {
  id: 'p-1',
  title: 'iPhone',
  images: [{ media: { id: 'm-1', objectKey: 'product/x.jpg', bucket: 'savdo-public' } }],
};

const ITEM_BASE = {
  id: 'item-1',
  productId: 'p-1',
  variantId: null,
  quantity: 2,
  unitPriceSnapshot: 100,
  salePriceSnapshot: null,
  product: PRODUCT,
  variant: null,
};

describe('GetCartUseCase', () => {
  let useCase: GetCartUseCase;
  let cartRepo: { findByBuyerId: jest.Mock; findBySessionKey: jest.Mock };

  beforeEach(() => {
    cartRepo = {
      findByBuyerId: jest.fn().mockResolvedValue(null),
      findBySessionKey: jest.fn().mockResolvedValue(null),
    };
    useCase = new GetCartUseCase(cartRepo as unknown as CartRepository);
  });

  describe('resolution', () => {
    it('buyerId → findByBuyerId', async () => {
      await useCase.execute({ buyerId: 'b-1' });
      expect(cartRepo.findByBuyerId).toHaveBeenCalledWith('b-1');
      expect(cartRepo.findBySessionKey).not.toHaveBeenCalled();
    });

    it('sessionKey → findBySessionKey', async () => {
      await useCase.execute({ sessionKey: 'sess-1' });
      expect(cartRepo.findBySessionKey).toHaveBeenCalledWith('sess-1');
      expect(cartRepo.findByBuyerId).not.toHaveBeenCalled();
    });

    it('buyerId приоритетнее sessionKey', async () => {
      await useCase.execute({ buyerId: 'b-1', sessionKey: 'sess-1' });
      expect(cartRepo.findByBuyerId).toHaveBeenCalled();
      expect(cartRepo.findBySessionKey).not.toHaveBeenCalled();
    });

    it('пустой input → empty cart', async () => {
      const result = await useCase.execute({});
      expect(result).toEqual({ id: null, storeId: null, items: [], totalAmount: 0, currencyCode: 'UZS' });
    });
  });

  describe('cart not found', () => {
    it('buyerId без cart → empty', async () => {
      cartRepo.findByBuyerId.mockResolvedValue(null);
      const result = await useCase.execute({ buyerId: 'b-1' });
      expect(result.id).toBeNull();
      expect(result.items).toEqual([]);
    });
  });

  describe('mapping', () => {
    it('одна позиция → unitPrice × quantity = subtotal', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({
        id: 'cart-1',
        storeId: 'store-1',
        currencyCode: 'UZS',
        items: [ITEM_BASE],
      });
      const result = await useCase.execute({ buyerId: 'b-1' }) as any;
      expect(result.id).toBe('cart-1');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].unitPrice).toBe(100);
      expect(result.items[0].subtotal).toBe(200);
      expect(result.totalAmount).toBe(200);
    });

    it('salePriceSnapshot перебивает unitPriceSnapshot', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({
        id: 'cart-1',
        storeId: 'store-1',
        items: [{ ...ITEM_BASE, unitPriceSnapshot: 100, salePriceSnapshot: 80 }],
      });
      const result = await useCase.execute({ buyerId: 'b-1' }) as any;
      expect(result.items[0].unitPrice).toBe(80);
      expect(result.items[0].subtotal).toBe(160);
    });

    it('totalAmount суммирует все позиции', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({
        id: 'cart-1',
        storeId: 'store-1',
        items: [
          { ...ITEM_BASE, id: 'i-1', quantity: 2, unitPriceSnapshot: 100 }, // 200
          { ...ITEM_BASE, id: 'i-2', quantity: 1, unitPriceSnapshot: 50 },  // 50
        ],
      });
      const result = await useCase.execute({ buyerId: 'b-1' }) as any;
      expect(result.totalAmount).toBe(250);
    });

    it('variant.titleOverride используется если задан', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({
        id: 'cart-1',
        storeId: 'store-1',
        items: [{
          ...ITEM_BASE,
          variantId: 'v-1',
          variant: { id: 'v-1', sku: 'SKU1', titleOverride: 'Red XL', optionValues: [] },
        }],
      });
      const result = await useCase.execute({ buyerId: 'b-1' }) as any;
      expect(result.items[0].variant).toEqual({ id: 'v-1', sku: 'SKU1', title: 'Red XL' });
    });

    it('variant без titleOverride → optionValues join через " / "', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({
        id: 'cart-1',
        storeId: 'store-1',
        items: [{
          ...ITEM_BASE,
          variantId: 'v-1',
          variant: {
            id: 'v-1',
            sku: 'SKU1',
            titleOverride: null,
            optionValues: [
              { optionValue: { value: 'Red' } },
              { optionValue: { value: 'XL' } },
            ],
          },
        }],
      });
      const result = await useCase.execute({ buyerId: 'b-1' }) as any;
      expect(result.items[0].variant.title).toBe('Red / XL');
    });

    it('telegram-expired bucket → mediaUrl=null', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({
        id: 'cart-1',
        storeId: 'store-1',
        items: [{
          ...ITEM_BASE,
          product: {
            ...PRODUCT,
            images: [{ media: { id: 'm-1', objectKey: 'x', bucket: 'telegram-expired' } }],
          },
        }],
      });
      const result = await useCase.execute({ buyerId: 'b-1' }) as any;
      expect(result.items[0].product.mediaUrl).toBeNull();
    });

    it('currencyCode дефолт UZS если не указан', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({
        id: 'cart-1',
        storeId: 'store-1',
        items: [],
      });
      const result = await useCase.execute({ buyerId: 'b-1' }) as any;
      expect(result.currencyCode).toBe('UZS');
    });
  });
});
