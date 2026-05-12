/**
 * Тесты для `BulkMergeCartUseCase` (TMA-CART-API-SYNC-001).
 *
 * Покрытие:
 *   - empty items → VALIDATION_ERROR
 *   - all items невалидные → PRODUCT_NOT_FOUND
 *   - INV-C01: items из разных store → CART_STORE_MISMATCH
 *   - no cart → createForBuyer + add items
 *   - existing cart same store → reuse + add
 *   - existing cart different store → clear + setStoreId + add
 *   - дубликаты по productId+variantId → quantity sum (max 100)
 *   - variant.priceOverride используется
 *   - skipped count returns
 */
import { ProductStatus } from '@prisma/client';
import { BulkMergeCartUseCase } from './bulk-merge-cart.use-case';
import { CartRepository } from '../repositories/cart.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';

const PRODUCT_1 = { id: 'p-1', storeId: 'store-1', status: ProductStatus.ACTIVE, deletedAt: null, basePrice: 100, salePrice: null };
const PRODUCT_2 = { id: 'p-2', storeId: 'store-1', status: ProductStatus.ACTIVE, deletedAt: null, basePrice: 200, salePrice: 150 };

describe('BulkMergeCartUseCase', () => {
  let useCase: BulkMergeCartUseCase;
  let cartRepo: {
    findByBuyerId: jest.Mock;
    findById: jest.Mock;
    createForBuyer: jest.Mock;
    clearCart: jest.Mock;
    setStoreId: jest.Mock;
    addItem: jest.Mock;
    updateItemQuantity: jest.Mock;
    findItemByProductAndVariant: jest.Mock;
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
      findByBuyerId: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue({
        id: 'cart-1', storeId: 'store-1', currencyCode: 'UZS', items: [],
      }),
      createForBuyer: jest.fn().mockResolvedValue({ id: 'cart-1' }),
      clearCart: jest.fn().mockResolvedValue(undefined),
      setStoreId: jest.fn().mockResolvedValue({ id: 'cart-1', storeId: 'store-1' }),
      addItem: jest.fn().mockResolvedValue({ id: 'item-1' }),
      updateItemQuantity: jest.fn().mockResolvedValue({ id: 'item-1' }),
      findItemByProductAndVariant: jest.fn().mockResolvedValue(null),
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

  it('no cart → createForBuyer + addItem', async () => {
    const result = await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', quantity: 2 }],
    });
    expect(cartRepo.createForBuyer).toHaveBeenCalledWith('b-1', 'store-1');
    expect(cartRepo.addItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
      productId: 'p-1',
      quantity: 2,
      unitPriceSnapshot: 100,
    }));
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
  });

  it('existing cart same store → reuse', async () => {
    cartRepo.findByBuyerId.mockResolvedValue({
      id: 'cart-existing', storeId: 'store-1', currencyCode: 'UZS', items: [],
    });
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', quantity: 1 }],
    });
    expect(cartRepo.createForBuyer).not.toHaveBeenCalled();
    expect(cartRepo.clearCart).not.toHaveBeenCalled();
    expect(cartRepo.addItem).toHaveBeenCalledWith('cart-existing', expect.any(Object));
  });

  it('existing cart другой store → clear + setStoreId + add', async () => {
    cartRepo.findByBuyerId.mockResolvedValue({
      id: 'cart-existing', storeId: 'store-OLD', currencyCode: 'UZS', items: [],
    });
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', quantity: 1 }],
    });
    expect(cartRepo.clearCart).toHaveBeenCalledWith('cart-existing');
    expect(cartRepo.setStoreId).toHaveBeenCalledWith('cart-existing', 'store-1');
  });

  it('дубликат: existing item → updateItemQuantity (sum, max 100)', async () => {
    cartRepo.findItemByProductAndVariant.mockResolvedValue({
      id: 'item-existing', quantity: 3,
    });
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', quantity: 5 }],
    });
    expect(cartRepo.updateItemQuantity).toHaveBeenCalledWith('item-existing', 8);
    expect(cartRepo.addItem).not.toHaveBeenCalled();
  });

  it('дубликат: existing qty + new > 100 → clamp к 100', async () => {
    cartRepo.findItemByProductAndVariant.mockResolvedValue({
      id: 'item-existing', quantity: 95,
    });
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', quantity: 50 }],
    });
    expect(cartRepo.updateItemQuantity).toHaveBeenCalledWith('item-existing', 100);
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
      priceOverride: 80, titleOverride: null,
    }]]));
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-1', variantId: 'v-1', quantity: 1 }],
    });
    expect(cartRepo.addItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
      variantId: 'v-1',
      unitPriceSnapshot: 80,
    }));
  });

  it('variant cross-product → skipped (с другим valid item)', async () => {
    variantsRepo.findManyByIds = jest.fn().mockResolvedValue(new Map([['v-1', {
      id: 'v-1', productId: 'p-OTHER', isActive: true, deletedAt: null,
      priceOverride: null, titleOverride: null,
    }]]));
    const result = await useCase.execute({
      buyerId: 'b-1',
      items: [
        { productId: 'p-1', variantId: 'v-1', quantity: 1 }, // skipped (variant cross-product)
        { productId: 'p-2', quantity: 1 },                    // valid
      ],
    });
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(1);
    expect(cartRepo.addItem).toHaveBeenCalledTimes(1);
    expect(cartRepo.addItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
      productId: 'p-2',
    }));
  });

  it('salePrice product передаётся в snapshot', async () => {
    await useCase.execute({
      buyerId: 'b-1',
      items: [{ productId: 'p-2', quantity: 1 }],
    });
    expect(cartRepo.addItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
      salePriceSnapshot: 150,
    }));
  });
});
