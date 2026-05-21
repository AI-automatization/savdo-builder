/**
 * Тесты для `PreviewCheckoutUseCase`.
 *
 * MVP checkout preview — pre-flight before confirm. Покрытие:
 *   - empty cart → CART_EMPTY
 *   - product not found / not ACTIVE → invalid
 *   - variant: not found / not active / out of stock → invalid (с reason)
 *   - variant.priceOverride перебивает unitPriceSnapshot
 *   - variantTitle: optionValues > titleOverride
 *   - valid=false когда есть invalid items, stockWarnings = reasons
 *   - subtotal = Σ valid subtotals
 */
import { ProductStatus } from '@prisma/client';
import { PreviewCheckoutUseCase } from './preview-checkout.use-case';
import { CartRepository } from '../../cart/repositories/cart.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';
import { CheckoutRepository } from '../repositories/checkout.repository';

const PRODUCT = { id: 'p-1', title: 'iPhone', status: ProductStatus.ACTIVE };
const ITEM_PLAIN = {
  id: 'i-1', productId: 'p-1', variantId: null, quantity: 2, unitPriceSnapshot: 100,
};
const ITEM_VARIANT = {
  id: 'i-2', productId: 'p-1', variantId: 'v-1', quantity: 1, unitPriceSnapshot: 100,
};

describe('PreviewCheckoutUseCase', () => {
  let useCase: PreviewCheckoutUseCase;
  let cartRepo: { findByBuyerId: jest.Mock };
  let productsRepo: { findById: jest.Mock };
  let variantsRepo: { findById: jest.Mock };
  let checkoutRepo: { findStoreWithSeller: jest.Mock };

  beforeEach(() => {
    cartRepo = {
      findByBuyerId: jest.fn().mockResolvedValue({
        id: 'cart-1', storeId: 'store-1', currencyCode: 'UZS', items: [ITEM_PLAIN],
      }),
    };
    productsRepo = { findById: jest.fn().mockResolvedValue(PRODUCT) };
    variantsRepo = { findById: jest.fn() };
    // По умолчанию — тариф 'none' → deliveryFee 0. Тесты доставки переопределяют.
    checkoutRepo = {
      findStoreWithSeller: jest.fn().mockResolvedValue({
        deliverySettings: { deliveryFeeType: 'none', fixedDeliveryFee: null },
      }),
    };
    useCase = new PreviewCheckoutUseCase(
      cartRepo as unknown as CartRepository,
      productsRepo as unknown as ProductsRepository,
      variantsRepo as unknown as VariantsRepository,
      checkoutRepo as unknown as CheckoutRepository,
    );
  });

  it('cart null → CART_EMPTY', async () => {
    cartRepo.findByBuyerId.mockResolvedValue(null);
    await expect(useCase.execute({ buyerId: 'b-1' })).rejects.toThrow(/empty/);
  });

  it('cart с пустым items → CART_EMPTY', async () => {
    cartRepo.findByBuyerId.mockResolvedValue({ id: 'cart-1', storeId: 's', currencyCode: 'UZS', items: [] });
    await expect(useCase.execute({ buyerId: 'b-1' })).rejects.toThrow(/empty/);
  });

  it('happy path плоский: valid=true, subtotal=200', async () => {
    const result = await useCase.execute({ buyerId: 'b-1' });
    expect(result.valid).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.subtotal).toBe(200);
    expect(result.deliveryFee).toBe(0);
    expect(result.total).toBe(200);
    expect(result.stockWarnings).toEqual([]);
  });

  // API-CHECKOUT-PREVIEW-DELIVERY-FEE-001 (WB-B01): preview считает реальную
  // плату за доставку, не хардкодит 0 — иначе расходится с confirm.
  it('fixed-тариф доставки: deliveryFee и total включают плату', async () => {
    checkoutRepo.findStoreWithSeller.mockResolvedValue({
      deliverySettings: { deliveryFeeType: 'fixed', fixedDeliveryFee: 15000 },
    });
    const result = await useCase.execute({ buyerId: 'b-1' });
    expect(result.subtotal).toBe(200);
    expect(result.deliveryFee).toBe(15000);
    expect(result.total).toBe(15200);
  });

  it('manual-тариф доставки: deliveryFee 0 (продавец выставит вручную)', async () => {
    checkoutRepo.findStoreWithSeller.mockResolvedValue({
      deliverySettings: { deliveryFeeType: 'manual', fixedDeliveryFee: null },
    });
    const result = await useCase.execute({ buyerId: 'b-1' });
    expect(result.deliveryFee).toBe(0);
    expect(result.total).toBe(200);
  });

  it('product not found → invalid + reason', async () => {
    productsRepo.findById.mockResolvedValue(null);
    const result = await useCase.execute({ buyerId: 'b-1' });
    expect(result.valid).toBe(false);
    expect(result.stockWarnings).toEqual(['Product not found']);
    expect(result.items).toHaveLength(0);
  });

  it('product DRAFT (не ACTIVE) → invalid', async () => {
    productsRepo.findById.mockResolvedValue({ ...PRODUCT, status: ProductStatus.DRAFT });
    const result = await useCase.execute({ buyerId: 'b-1' });
    expect(result.valid).toBe(false);
    expect(result.stockWarnings[0]).toMatch(/no longer active/);
  });

  describe('variant validation', () => {
    beforeEach(() => {
      cartRepo.findByBuyerId.mockResolvedValue({
        id: 'cart-1', storeId: 's', currencyCode: 'UZS', items: [ITEM_VARIANT],
      });
    });

    it('variant not found → invalid', async () => {
      variantsRepo.findById.mockResolvedValue(null);
      const result = await useCase.execute({ buyerId: 'b-1' });
      expect(result.valid).toBe(false);
      expect(result.stockWarnings[0]).toMatch(/Variant not found/);
    });

    it('variant !isActive → invalid', async () => {
      variantsRepo.findById.mockResolvedValue({
        id: 'v-1', isActive: false, stockQuantity: 10, optionValues: [], priceOverride: null, sku: null,
      });
      const result = await useCase.execute({ buyerId: 'b-1' });
      expect(result.valid).toBe(false);
      expect(result.stockWarnings[0]).toMatch(/no longer available/);
    });

    it('stockQuantity < quantity → invalid с числами', async () => {
      variantsRepo.findById.mockResolvedValue({
        id: 'v-1', isActive: true, stockQuantity: 0, optionValues: [], priceOverride: null, sku: null,
      });
      const result = await useCase.execute({ buyerId: 'b-1' });
      expect(result.valid).toBe(false);
      expect(result.stockWarnings[0]).toMatch(/available 0, requested 1/);
    });

    it('priceOverride перебивает unitPriceSnapshot', async () => {
      variantsRepo.findById.mockResolvedValue({
        id: 'v-1', isActive: true, stockQuantity: 10, optionValues: [],
        priceOverride: 80, sku: 'SKU1',
      });
      const result = await useCase.execute({ buyerId: 'b-1' });
      expect(result.items[0].unitPrice).toBe(80);
      expect(result.subtotal).toBe(80);
    });

    it('variantTitle: optionValues join приоритет над titleOverride', async () => {
      variantsRepo.findById.mockResolvedValue({
        id: 'v-1', isActive: true, stockQuantity: 10,
        optionValues: [
          { optionValue: { value: 'Red' } },
          { optionValue: { value: 'XL' } },
        ],
        titleOverride: 'Custom',
        priceOverride: null, sku: null,
      });
      const result = await useCase.execute({ buyerId: 'b-1' });
      expect(result.items[0].variantTitle).toBe('Red / XL');
    });

    it('без optionValues → titleOverride используется', async () => {
      variantsRepo.findById.mockResolvedValue({
        id: 'v-1', isActive: true, stockQuantity: 10,
        optionValues: [],
        titleOverride: 'Custom Variant',
        priceOverride: null, sku: 'SKU2',
      });
      const result = await useCase.execute({ buyerId: 'b-1' });
      expect(result.items[0].variantTitle).toBe('Custom Variant');
      expect(result.items[0].skuSnapshot).toBe('SKU2');
    });
  });

  describe('mixed valid + invalid', () => {
    it('один valid + один invalid → valid=false, items только valid', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({
        id: 'cart-1', storeId: 's', currencyCode: 'UZS',
        items: [
          { id: 'i-1', productId: 'p-1', variantId: null, quantity: 1, unitPriceSnapshot: 50 }, // valid
          { id: 'i-2', productId: 'p-2', variantId: null, quantity: 1, unitPriceSnapshot: 30 }, // invalid (not found)
        ],
      });
      productsRepo.findById.mockImplementation((id: string) =>
        id === 'p-1' ? PRODUCT : null,
      );
      const result = await useCase.execute({ buyerId: 'b-1' });
      expect(result.valid).toBe(false);
      expect(result.items).toHaveLength(1);
      expect(result.subtotal).toBe(50);
      expect(result.stockWarnings).toEqual(['Product not found']);
    });
  });
});
