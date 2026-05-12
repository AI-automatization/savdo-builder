/**
 * Тесты для `ValidateCartItemsService`.
 *
 * Финансово-критичный flow — ошибка валидации = проданный товар которого
 * нет на складе или с устаревшей ценой. Покрываем все ветки.
 */
import { ProductStatus } from '@prisma/client';
import { ValidateCartItemsService } from './validate-cart-items.service';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';

const PRODUCT_ACTIVE = {
  id: 'p-1',
  storeId: 'store-1',
  title: 'iPhone 16',
  status: ProductStatus.ACTIVE,
  basePrice: 1000,
  deletedAt: null,
};

const VARIANT_VALID = {
  id: 'v-1',
  productId: 'p-1',
  isActive: true,
  stockQuantity: 10,
  priceOverride: null as number | null,
  titleOverride: null as string | null,
  sku: 'IPH16-256',
  optionValues: [] as Array<{ optionValue: { value: string } | null }>,
  deletedAt: null,
};

describe('ValidateCartItemsService', () => {
  let service: ValidateCartItemsService;
  let productsRepo: { findById: jest.Mock };
  let variantsRepo: { findById: jest.Mock };

  beforeEach(() => {
    productsRepo = { findById: jest.fn() };
    variantsRepo = { findById: jest.fn() };
    service = new ValidateCartItemsService(
      productsRepo as unknown as ProductsRepository,
      variantsRepo as unknown as VariantsRepository,
    );
  });

  describe('happy path', () => {
    it('пустой массив → пустой результат', async () => {
      const result = await service.validate([]);
      expect(result).toEqual([]);
    });

    it('item без variant → unitPrice из cartItem snapshot', async () => {
      productsRepo.findById.mockResolvedValue(PRODUCT_ACTIVE);
      const result = await service.validate([
        { productId: 'p-1', variantId: null, quantity: 2, unitPriceSnapshot: 500 },
      ]);
      expect(result).toEqual([{
        productId: 'p-1',
        variantId: undefined,
        productTitleSnapshot: 'iPhone 16',
        variantLabelSnapshot: undefined,
        skuSnapshot: undefined,
        unitPriceSnapshot: 500,
        quantity: 2,
        lineTotalAmount: 1000,
      }]);
    });

    it('item с variant → priceOverride переопределяет цену из cartItem', async () => {
      productsRepo.findById.mockResolvedValue(PRODUCT_ACTIVE);
      variantsRepo.findById.mockResolvedValue({ ...VARIANT_VALID, priceOverride: 1200 });
      const result = await service.validate([
        { productId: 'p-1', variantId: 'v-1', quantity: 1, unitPriceSnapshot: 1000 },
      ]);
      expect(result[0].unitPriceSnapshot).toBe(1200);
      expect(result[0].lineTotalAmount).toBe(1200);
      expect(result[0].skuSnapshot).toBe('IPH16-256');
    });

    it('variantLabel собирается из optionValues junctions', async () => {
      productsRepo.findById.mockResolvedValue(PRODUCT_ACTIVE);
      variantsRepo.findById.mockResolvedValue({
        ...VARIANT_VALID,
        optionValues: [
          { optionValue: { value: 'Black' } },
          { optionValue: { value: '256GB' } },
        ],
      });
      const result = await service.validate([
        { productId: 'p-1', variantId: 'v-1', quantity: 1, unitPriceSnapshot: 1000 },
      ]);
      expect(result[0].variantLabelSnapshot).toBe('Black / 256GB');
    });

    it('variantLabel fallback на titleOverride если optionValues пустой', async () => {
      productsRepo.findById.mockResolvedValue(PRODUCT_ACTIVE);
      variantsRepo.findById.mockResolvedValue({ ...VARIANT_VALID, titleOverride: 'Pro Max' });
      const result = await service.validate([
        { productId: 'p-1', variantId: 'v-1', quantity: 1, unitPriceSnapshot: 1000 },
      ]);
      expect(result[0].variantLabelSnapshot).toBe('Pro Max');
    });
  });

  describe('product validation', () => {
    it('продукт не найден → CHECKOUT_ITEMS_UNAVAILABLE с reason "Product not found"', async () => {
      productsRepo.findById.mockResolvedValue(null);
      await expect(service.validate([
        { productId: 'p-deleted', variantId: null, quantity: 1, unitPriceSnapshot: 100 },
      ])).rejects.toMatchObject({
        code: expect.any(String),
        details: { invalidItems: [{ productId: 'p-deleted', variantId: null, reason: 'Product not found' }] },
      });
    });

    it('продукт не ACTIVE (DRAFT/HIDDEN/ARCHIVED) → invalid', async () => {
      productsRepo.findById.mockResolvedValue({ ...PRODUCT_ACTIVE, status: ProductStatus.DRAFT });
      await expect(service.validate([
        { productId: 'p-1', variantId: null, quantity: 1, unitPriceSnapshot: 100 },
      ])).rejects.toMatchObject({
        details: { invalidItems: [{ reason: 'Product is no longer active' }] },
      });
    });
  });

  describe('variant validation', () => {
    beforeEach(() => {
      productsRepo.findById.mockResolvedValue(PRODUCT_ACTIVE);
    });

    it('variant не найден → invalid', async () => {
      variantsRepo.findById.mockResolvedValue(null);
      await expect(service.validate([
        { productId: 'p-1', variantId: 'v-deleted', quantity: 1, unitPriceSnapshot: 100 },
      ])).rejects.toMatchObject({
        details: { invalidItems: [{ reason: 'Variant not found' }] },
      });
    });

    it('variant принадлежит другому продукту → invalid', async () => {
      variantsRepo.findById.mockResolvedValue({ ...VARIANT_VALID, productId: 'p-other' });
      await expect(service.validate([
        { productId: 'p-1', variantId: 'v-1', quantity: 1, unitPriceSnapshot: 100 },
      ])).rejects.toMatchObject({
        details: { invalidItems: [{ reason: 'Variant does not belong to this product' }] },
      });
    });

    it('variant неактивен → invalid', async () => {
      variantsRepo.findById.mockResolvedValue({ ...VARIANT_VALID, isActive: false });
      await expect(service.validate([
        { productId: 'p-1', variantId: 'v-1', quantity: 1, unitPriceSnapshot: 100 },
      ])).rejects.toMatchObject({
        details: { invalidItems: [{ reason: 'Variant is no longer available' }] },
      });
    });

    it('недостаточный stock → invalid с конкретным числом', async () => {
      variantsRepo.findById.mockResolvedValue({ ...VARIANT_VALID, stockQuantity: 3 });
      await expect(service.validate([
        { productId: 'p-1', variantId: 'v-1', quantity: 5, unitPriceSnapshot: 100 },
      ])).rejects.toMatchObject({
        details: { invalidItems: [{ reason: 'Insufficient stock: available 3, requested 5' }] },
      });
    });
  });

  describe('multiple invalid items', () => {
    it('собирает все ошибки до throw — UI показывает все сразу', async () => {
      productsRepo.findById.mockImplementation((id: string) => {
        if (id === 'p-not-found') return null;
        if (id === 'p-draft') return { ...PRODUCT_ACTIVE, id, status: ProductStatus.DRAFT };
        return PRODUCT_ACTIVE;
      });
      variantsRepo.findById.mockResolvedValue({ ...VARIANT_VALID, stockQuantity: 0 });

      await expect(service.validate([
        { productId: 'p-not-found', variantId: null, quantity: 1, unitPriceSnapshot: 100 },
        { productId: 'p-draft',     variantId: null, quantity: 1, unitPriceSnapshot: 100 },
        { productId: 'p-1',         variantId: 'v-1', quantity: 1, unitPriceSnapshot: 100 },
      ])).rejects.toMatchObject({
        details: {
          invalidItems: [
            { productId: 'p-not-found', reason: 'Product not found' },
            { productId: 'p-draft',     reason: 'Product is no longer active' },
            { productId: 'p-1',         reason: expect.stringMatching(/Insufficient stock/) },
          ],
        },
      });
    });
  });
});
