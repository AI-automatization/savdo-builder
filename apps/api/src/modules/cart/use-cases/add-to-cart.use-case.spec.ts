/**
 * Тесты для `AddToCartUseCase`.
 *
 * Покрытие:
 *   - INV-C03: product/variant должны быть ACTIVE (+ stock > 0 для variant)
 *   - INV-C01: cart only с одним store — конфликт → 409
 *   - upsertItem вызывается с правильными price snapshot'ами
 *   - getOrCreateForBuyer / getOrCreateForGuest для разных идентификаторов
 *   - ни buyerId ни sessionKey → 401
 */
import { ProductStatus } from '@prisma/client';
import { AddToCartUseCase } from './add-to-cart.use-case';
import { CartRepository } from '../repositories/cart.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';

const PRODUCT_ACTIVE = {
  id: 'p-1',
  storeId: 'store-1',
  status: ProductStatus.ACTIVE,
  basePrice: 1000,
  totalStock: 50,
};

const VARIANT_VALID = {
  id: 'v-1',
  productId: 'p-1',
  isActive: true,
  stockQuantity: 10,
  priceOverride: null as number | null,
  salePriceOverride: null as number | null,
};

const CART_EMPTY = { id: 'cart-1', storeId: 'store-1', currencyCode: 'UZS', items: [] };

describe('AddToCartUseCase', () => {
  let useCase: AddToCartUseCase;
  let cartRepo: {
    getOrCreateForBuyer: jest.Mock;
    getOrCreateForGuest: jest.Mock;
    findById: jest.Mock;
    findItemByProductAndVariant: jest.Mock;
    upsertItem: jest.Mock;
  };
  let productsRepo: { findById: jest.Mock };
  let variantsRepo: { findById: jest.Mock };

  beforeEach(() => {
    cartRepo = {
      getOrCreateForBuyer: jest.fn().mockResolvedValue(CART_EMPTY),
      getOrCreateForGuest: jest.fn().mockResolvedValue(CART_EMPTY),
      findById: jest.fn().mockResolvedValue(CART_EMPTY),
      findItemByProductAndVariant: jest.fn().mockResolvedValue(null),
      upsertItem: jest.fn().mockResolvedValue(undefined),
    };
    productsRepo = { findById: jest.fn().mockResolvedValue(PRODUCT_ACTIVE) };
    variantsRepo = { findById: jest.fn().mockResolvedValue(VARIANT_VALID) };

    useCase = new AddToCartUseCase(
      cartRepo as unknown as CartRepository,
      productsRepo as unknown as ProductsRepository,
      variantsRepo as unknown as VariantsRepository,
    );
  });

  describe('product validation (INV-C03)', () => {
    it('product не найден → 404', async () => {
      productsRepo.findById.mockResolvedValue(null);
      await expect(useCase.execute({ productId: 'p-missing', quantity: 1, buyerId: 'b-1' }))
        .rejects.toThrow(/Product not found/);
    });

    it('product не ACTIVE (DRAFT) → PRODUCT_NOT_ACTIVE', async () => {
      productsRepo.findById.mockResolvedValue({ ...PRODUCT_ACTIVE, status: ProductStatus.DRAFT });
      await expect(useCase.execute({ productId: 'p-1', quantity: 1, buyerId: 'b-1' }))
        .rejects.toThrow(/not available/);
    });
  });

  describe('variant validation (INV-C03)', () => {
    it('variant не найден → VARIANT_NOT_FOUND', async () => {
      variantsRepo.findById.mockResolvedValue(null);
      await expect(useCase.execute({ productId: 'p-1', variantId: 'v-missing', quantity: 1, buyerId: 'b-1' }))
        .rejects.toThrow(/Variant not found/);
    });

    it('variant не active → PRODUCT_NOT_ACTIVE', async () => {
      variantsRepo.findById.mockResolvedValue({ ...VARIANT_VALID, isActive: false });
      await expect(useCase.execute({ productId: 'p-1', variantId: 'v-1', quantity: 1, buyerId: 'b-1' }))
        .rejects.toThrow(/not available/);
    });

    it('variant stock = 0 → PRODUCT_NOT_ACTIVE', async () => {
      variantsRepo.findById.mockResolvedValue({ ...VARIANT_VALID, stockQuantity: 0 });
      await expect(useCase.execute({ productId: 'p-1', variantId: 'v-1', quantity: 1, buyerId: 'b-1' }))
        .rejects.toThrow(/out of stock/);
    });

    it('priceOverride от variant → используется как unitPriceSnapshot', async () => {
      variantsRepo.findById.mockResolvedValue({ ...VARIANT_VALID, priceOverride: 1500 });
      await useCase.execute({ productId: 'p-1', variantId: 'v-1', quantity: 1, buyerId: 'b-1' });
      expect(cartRepo.upsertItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
        unitPriceSnapshot: 1500,
      }), 100);
    });

    it('salePriceOverride сохраняется в cart item', async () => {
      variantsRepo.findById.mockResolvedValue({ ...VARIANT_VALID, salePriceOverride: 800 });
      await useCase.execute({ productId: 'p-1', variantId: 'v-1', quantity: 1, buyerId: 'b-1' });
      expect(cartRepo.upsertItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
        salePriceSnapshot: 800,
      }), 100);
    });
  });

  describe('cart resolution', () => {
    it('buyer → getOrCreateForBuyer с product.storeId', async () => {
      await useCase.execute({ productId: 'p-1', quantity: 1, buyerId: 'b-1' });
      expect(cartRepo.getOrCreateForBuyer).toHaveBeenCalledWith('b-1', 'store-1');
    });

    it('guest sessionKey → getOrCreateForGuest с product.storeId', async () => {
      await useCase.execute({ productId: 'p-1', quantity: 1, sessionKey: 'sess-1' });
      expect(cartRepo.getOrCreateForGuest).toHaveBeenCalledWith('sess-1', 'store-1');
    });

    it('ни buyerId ни sessionKey → UNAUTHORIZED', async () => {
      await expect(useCase.execute({ productId: 'p-1', quantity: 1 }))
        .rejects.toThrow(/Either buyerId or sessionKey/);
    });
  });

  describe('INV-C01: один store на корзину', () => {
    it('cart с другим store → CART_STORE_MISMATCH', async () => {
      cartRepo.getOrCreateForBuyer.mockResolvedValue({ ...CART_EMPTY, storeId: 'store-OTHER' });
      await expect(useCase.execute({ productId: 'p-1', quantity: 1, buyerId: 'b-1' }))
        .rejects.toThrow(/different store/);
    });
  });

  describe('upsertItem (CART-001)', () => {
    it('item не существует → upsertItem вызван с productId + quantity', async () => {
      cartRepo.findItemByProductAndVariant.mockResolvedValue(null);
      await useCase.execute({ productId: 'p-1', quantity: 1, buyerId: 'b-1' });
      expect(cartRepo.upsertItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
        productId: 'p-1',
        quantity: 1,
      }), 100);
    });

    it('item уже есть → upsertItem вызван (ON CONFLICT суммирует на стороне БД)', async () => {
      cartRepo.findItemByProductAndVariant.mockResolvedValue({ id: 'item-1', quantity: 3 });
      await useCase.execute({ productId: 'p-1', quantity: 2, buyerId: 'b-1' });
      expect(cartRepo.upsertItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
        productId: 'p-1',
        quantity: 2,
      }), 100);
    });

    it('total > stockLimit → INSUFFICIENT_STOCK (use-case guard перед upsertItem)', async () => {
      cartRepo.findItemByProductAndVariant.mockResolvedValue({ id: 'item-1', quantity: 45 });
      // stockLimit = totalStock = 50; newQty = 45 + 10 = 55 > 50
      await expect(useCase.execute({ productId: 'p-1', quantity: 10, buyerId: 'b-1' }))
        .rejects.toThrow(/in stock/);
      expect(cartRepo.upsertItem).not.toHaveBeenCalled();
    });
  });
});
