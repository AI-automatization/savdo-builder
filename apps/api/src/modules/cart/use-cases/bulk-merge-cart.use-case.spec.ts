/**
 * Тесты для `BulkMergeCartUseCase` (TMA-CART-API-SYNC-001).
 *
 * Покрытие:
 *   - empty items → VALIDATION_ERROR
 *   - all items невалидные → PRODUCT_NOT_FOUND
 *   - INV-C01: items из разных store → CART_STORE_MISMATCH
 *   - no cart → getOrCreateForBuyer + upsertItem
 *   - existing cart same store → reuse (без clear)
 *   - existing cart different store → clear + setStoreId + upsertItem
 *   - quantity > 100 → clamp перед upsertItem
 *   - variant.priceOverride используется как unitPrice
 *   - variant cross-product → skipped
 *   - salePrice product передаётся в snapshot
 */
import { ProductStatus } from '@prisma/client';
import { BulkMergeCartUseCase } from './bulk-merge-cart.use-case';
import { CartRepository } from '../repositories/cart.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';

const PRODUCT_1 = { id: 'p-1', storeId: 'store-1', status: ProductStatus.ACTIVE, deletedAt: null, basePrice: 100, salePrice: null };
const PRODUCT_2 = { id: 'p-2', storeId: 'store-1', status: ProductStatus.ACTIVE, deletedAt: null, basePrice: 200, salePrice: 150 };

const CART_1 = { id: 'cart-1', storeId: 'store-1', currencyCode: 'UZS', items: [] };

describe('BulkMergeCartUseCase', () => {
  let useCase: BulkMergeCartUseCase;
  let cartRepo: {
    getOrCreateForBuyer: jest.Mock;
    clearCart: jest.Mock;
    setStoreId: jest.Mock;
    findById: jest.Mock;
    upsertItem: jest.Mock;
  };
  let productsRepo: { findManyByIds: jest.Mock };
  let variantsRepo: { findManyByIds: jest.Mock };

  function productMap(records: Array<{ id: string } & Record<string, unknown>>) {
    return jest.fn().mockImplementation(async (ids: string[]) => {
      const map = new Map();
      for (const r of records) if (ids.includes(r.id)) map.set(r.id, r);
      return map;
    });
  }

  beforeEach(() => {
    cartRepo = {
      getOrCreateForBuyer: jest.fn().mockResolvedValue(CART_1),
      clearCart: jest.fn().mockResolvedValue(undefined),
      setStoreId: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(CART_1),
      upsertItem: jest.fn().mockResolvedValue(undefined),
    };
    productsRepo = { findManyByIds: productMap([PRODUCT_1, PRODUCT_2]) };
    variantsRepo = { findManyByIds: jest.fn().mockResolvedValue(new Map()) };
    useCase = new BulkMergeCartUseCase(
      cartRepo as unknown as CartRepository,
      productsRepo as unknown as ProductsRepository,
      variantsRepo as unknown as VariantsRepository,
    );
  });

  it('empty items → VALIDATION_ERROR', async () => {
    await expect(useCase.execute({ buyerId: 'b-1', items: [] }))
      .rejects.toThrow(/must not be empty/);
  });

  it('все products невалидные → PRODUCT_NOT_FOUND', async () => {
    productsRepo.findManyByIds = jest.fn().mockResolvedValue(new Map());
    await expect(useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-missing', quantity: 1 }],
    })).rejects.toThrow(/No valid items/);
  });

  it('INV-C01: items из разных store → CART_STORE_MISMATCH', async () => {
    productsRepo.findManyByIds = productMap([
      PRODUCT_1,
      { ...PRODUCT_1, id: 'p-other', storeId: 'store-OTHER' },
    ]);
    await expect(useCase.execute({
      buyerId: 'b-1',
      items: [
        { productId: 'p-1', quantity: 1 },
        { productId: 'p-other', quantity: 1 },
      ],
    })).rejects.toThrow(/same store/);
  });

  it('no cart → getOrCreateForBuyer + upsertItem', async () => {
    const result = await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', quantity: 2 }],
    });
    expect(cartRepo.getOrCreateForBuyer).toHaveBeenCalledWith('b-1', 'store-1');
    expect(cartRepo.upsertItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
      productId: 'p-1',
      quantity: 2,
      unitPriceSnapshot: 100,
    }), 100);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
  });

  it('existing cart same store → reuse (без clear)', async () => {
    cartRepo.getOrCreateForBuyer.mockResolvedValue({ ...CART_1, id: 'cart-existing' });
    cartRepo.findById.mockResolvedValue({ ...CART_1, id: 'cart-existing' });
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', quantity: 1 }],
    });
    expect(cartRepo.clearCart).not.toHaveBeenCalled();
    expect(cartRepo.upsertItem).toHaveBeenCalledWith('cart-existing', expect.any(Object), 100);
  });

  it('existing cart другой store → clear + setStoreId + upsertItem', async () => {
    cartRepo.getOrCreateForBuyer
      .mockResolvedValueOnce({ ...CART_1, id: 'cart-1', storeId: 'store-OLD' })
      .mockResolvedValueOnce(CART_1);
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', quantity: 1 }],
    });
    expect(cartRepo.clearCart).toHaveBeenCalledWith('cart-1');
    expect(cartRepo.setStoreId).toHaveBeenCalledWith('cart-1', 'store-1');
    expect(cartRepo.upsertItem).toHaveBeenCalled();
  });

  it('quantity > 100 → clamp до 100 перед upsertItem', async () => {
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', quantity: 150 }],
    });
    expect(cartRepo.upsertItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
      quantity: 100,
    }), 100);
  });

  it('product DRAFT → skipped (не throws если есть другие valid)', async () => {
    productsRepo.findManyByIds = productMap([
      PRODUCT_1,
      { ...PRODUCT_2, status: ProductStatus.DRAFT },
    ]);
    const result = await useCase.execute({
      buyerId: 'b-1',
      items: [
        { productId: 'p-1', quantity: 1 },
        { productId: 'p-2', quantity: 1 },
      ],
    });
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('variant.priceOverride используется как unitPrice', async () => {
    variantsRepo.findManyByIds = jest.fn().mockResolvedValue(new Map([['v-1', {
      id: 'v-1', productId: 'p-1', isActive: true, deletedAt: null,
      priceOverride: 80, stockQuantity: 10, titleOverride: null,
    }]]));
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', variantId: 'v-1', quantity: 1 }],
    });
    expect(cartRepo.upsertItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
      variantId: 'v-1',
      unitPriceSnapshot: 80,
    }), 100);
  });

  it('variant cross-product → skipped (с другим valid item)', async () => {
    variantsRepo.findManyByIds = jest.fn().mockResolvedValue(new Map([['v-1', {
      id: 'v-1', productId: 'p-OTHER', isActive: true, deletedAt: null,
      priceOverride: null, stockQuantity: 10, titleOverride: null,
    }]]));
    const result = await useCase.execute({
      buyerId: 'b-1',
      items: [
        { productId: 'p-1', variantId: 'v-1', quantity: 1 },
        { productId: 'p-2', quantity: 1 },
      ],
    });
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(1);
    expect(cartRepo.upsertItem).toHaveBeenCalledTimes(1);
    expect(cartRepo.upsertItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
      productId: 'p-2',
    }), 100);
  });

  it('salePrice product передаётся в snapshot', async () => {
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-2', quantity: 1 }],
    });
    expect(cartRepo.upsertItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
      salePriceSnapshot: 150,
    }), 100);
  });
});
