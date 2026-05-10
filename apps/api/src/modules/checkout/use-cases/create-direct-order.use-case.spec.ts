/**
 * Тесты для `CreateDirectOrderUseCase`.
 *
 * Покупка минуя cart (one-click). Покрытие:
 *   - empty items → CART_EMPTY
 *   - product not active / deleted → PRODUCT_NOT_FOUND
 *   - INV-C01: items из разных store → CART_STORE_MISMATCH
 *   - variant validation: not found, неправильный productId, !isActive
 *   - stock insufficient
 *   - priceOverride перебивает basePrice
 *   - happy path → createOrder + emitOrderNew + TG notification
 */
import { ProductStatus } from '@prisma/client';
import { CreateDirectOrderUseCase } from './create-direct-order.use-case';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';
import { CheckoutRepository } from '../repositories/checkout.repository';
import { OrdersGateway } from '../../../socket/orders.gateway';
import { SellerNotificationService } from '../../telegram/services/seller-notification.service';

const PRODUCT_1 = {
  id: 'p-1', storeId: 'store-1', status: ProductStatus.ACTIVE, deletedAt: null,
  basePrice: 100, title: 'iPhone',
};
const STORE = {
  id: 'store-1', name: 'Test Store', sellerId: 'seller-1',
  seller: { telegramUsername: 'testseller' },
};

const VALID_DTO = {
  items: [{ productId: 'p-1', quantity: 2 }],
  buyerName: 'John',
  buyerPhone: '+998900000001',
  deliveryAddress: 'Tashkent',
} as any;

describe('CreateDirectOrderUseCase', () => {
  let useCase: CreateDirectOrderUseCase;
  // API-N1-CHECKOUT-001: use-case теперь зовёт findManyByIds (batch).
  // Каждый mock — функция которая принимает ids[] и возвращает Map.
  let productsRepo: { findManyByIds: jest.Mock };
  let variantsRepo: { findManyByIds: jest.Mock };
  let checkoutRepo: { findStoreWithSeller: jest.Mock; createOrder: jest.Mock };
  let ordersGateway: { emitOrderNew: jest.Mock };
  let tgNotifier: { notifyNewOrder: jest.Mock };

  /** Хелпер: имитирует findManyByIds — возвращает Map для подмножества known ids. */
  function productsByIds(records: Array<{ id: string } & Record<string, unknown>>) {
    return jest.fn().mockImplementation(async (ids: string[]) => {
      const map = new Map();
      for (const r of records) {
        if (ids.includes(r.id)) map.set(r.id, r);
      }
      return map;
    });
  }

  beforeEach(() => {
    productsRepo = { findManyByIds: productsByIds([PRODUCT_1]) };
    variantsRepo = { findManyByIds: jest.fn().mockResolvedValue(new Map()) };
    checkoutRepo = {
      findStoreWithSeller: jest.fn().mockResolvedValue(STORE),
      createOrder: jest.fn().mockResolvedValue({
        id: 'order-1', orderNumber: 'ORD-X', totalAmount: 200,
      }),
    };
    ordersGateway = { emitOrderNew: jest.fn() };
    tgNotifier = { notifyNewOrder: jest.fn() };
    useCase = new CreateDirectOrderUseCase(
      productsRepo as unknown as ProductsRepository,
      variantsRepo as unknown as VariantsRepository,
      checkoutRepo as unknown as CheckoutRepository,
      ordersGateway as unknown as OrdersGateway,
      tgNotifier as unknown as SellerNotificationService,
    );
  });

  it('empty items → CART_EMPTY', async () => {
    await expect(useCase.execute({
      buyerId: 'b-1', userId: 'u-1', dto: { ...VALID_DTO, items: [] },
    })).rejects.toThrow(/at least one item/);
  });

  it('product not found → PRODUCT_NOT_FOUND', async () => {
    productsRepo.findManyByIds = jest.fn().mockResolvedValue(new Map());
    await expect(useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: VALID_DTO }))
      .rejects.toThrow(/not available/);
  });

  it('product DRAFT → PRODUCT_NOT_FOUND', async () => {
    productsRepo.findManyByIds = productsByIds([{ ...PRODUCT_1, status: ProductStatus.DRAFT }]);
    await expect(useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: VALID_DTO }))
      .rejects.toThrow(/not available/);
  });

  it('product deleted → PRODUCT_NOT_FOUND', async () => {
    productsRepo.findManyByIds = productsByIds([{ ...PRODUCT_1, deletedAt: new Date() }]);
    await expect(useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: VALID_DTO }))
      .rejects.toThrow(/not available/);
  });

  it('INV-C01: items из разных store → CART_STORE_MISMATCH', async () => {
    productsRepo.findManyByIds = productsByIds([
      PRODUCT_1,
      { ...PRODUCT_1, id: 'p-2', storeId: 'store-OTHER' },
    ]);
    await expect(useCase.execute({
      buyerId: 'b-1', userId: 'u-1',
      dto: { ...VALID_DTO, items: [
        { productId: 'p-1', quantity: 1 },
        { productId: 'p-2', quantity: 1 },
      ] },
    })).rejects.toThrow(/same store/);
  });

  describe('variant', () => {
    const DTO_VARIANT = {
      ...VALID_DTO,
      items: [{ productId: 'p-1', variantId: 'v-1', quantity: 1 }],
    };

    /** Хелпер для variants — Map [id → variant] */
    function variantMap(variants: Array<{ id: string } & Record<string, unknown>>) {
      return jest.fn().mockResolvedValue(new Map(variants.map((v) => [v.id, v])));
    }

    it('variant не найден → 422', async () => {
      variantsRepo.findManyByIds = jest.fn().mockResolvedValue(new Map());
      await expect(useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: DTO_VARIANT }))
        .rejects.toThrow(/Variant not found/);
    });

    it('variant.productId mismatch → 422 (защита от cross-product variant inject)', async () => {
      variantsRepo.findManyByIds = variantMap([{
        id: 'v-1', productId: 'p-OTHER', isActive: true, stockQuantity: 10,
        deletedAt: null, priceOverride: null, titleOverride: null,
      }]);
      await expect(useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: DTO_VARIANT }))
        .rejects.toThrow(/Variant not found/);
    });

    it('variant !isActive → 422', async () => {
      variantsRepo.findManyByIds = variantMap([{
        id: 'v-1', productId: 'p-1', isActive: false, stockQuantity: 10,
        deletedAt: null, priceOverride: null, titleOverride: null,
      }]);
      await expect(useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: DTO_VARIANT }))
        .rejects.toThrow(/Variant not found/);
    });

    it('stock < quantity → CHECKOUT_STOCK_INSUFFICIENT', async () => {
      variantsRepo.findManyByIds = variantMap([{
        id: 'v-1', productId: 'p-1', isActive: true, stockQuantity: 0,
        deletedAt: null, priceOverride: null, titleOverride: null,
      }]);
      await expect(useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: DTO_VARIANT }))
        .rejects.toThrow(/Insufficient stock/);
    });

    it('priceOverride перебивает basePrice', async () => {
      variantsRepo.findManyByIds = variantMap([{
        id: 'v-1', productId: 'p-1', isActive: true, stockQuantity: 10,
        deletedAt: null, priceOverride: 80, titleOverride: 'Red XL',
      }]);
      await useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: DTO_VARIANT });
      const orderArg = checkoutRepo.createOrder.mock.calls[0][0];
      expect(orderArg.subtotalAmount).toBe(80);
      expect(orderArg.items[0].unitPriceSnapshot).toBe(80);
      expect(orderArg.items[0].variantLabelSnapshot).toBe('Red XL');
    });

    it('API-N1-CHECKOUT-001: вызывает findManyByIds один раз вместо N findById', async () => {
      variantsRepo.findManyByIds = variantMap([{
        id: 'v-1', productId: 'p-1', isActive: true, stockQuantity: 10,
        deletedAt: null, priceOverride: null, titleOverride: null,
      }]);
      productsRepo.findManyByIds = productsByIds([PRODUCT_1]);
      const dto3 = { ...VALID_DTO, items: [
        { productId: 'p-1', variantId: 'v-1', quantity: 1 },
        { productId: 'p-1', variantId: 'v-1', quantity: 2 },
        { productId: 'p-1', variantId: 'v-1', quantity: 3 },
      ] };
      await useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: dto3 });
      // 3 items → но только 1 findManyByIds вызов на каждый репозиторий.
      expect(productsRepo.findManyByIds).toHaveBeenCalledTimes(1);
      expect(variantsRepo.findManyByIds).toHaveBeenCalledTimes(1);
    });
  });

  describe('store + happy path', () => {
    it('store не найден → STORE_NOT_FOUND', async () => {
      checkoutRepo.findStoreWithSeller.mockResolvedValue(null);
      await expect(useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: VALID_DTO }))
        .rejects.toThrow(/Store not found/);
    });

    it('happy: создаёт order + emit + TG notify', async () => {
      const result = await useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: VALID_DTO });
      expect(checkoutRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        buyerId: 'b-1',
        storeId: 'store-1',
        sellerId: 'seller-1',
        subtotalAmount: 200, // 100 × 2
        totalAmount: 200,
        currencyCode: 'UZS',
        customerFullName: 'John',
        customerPhone: '+998900000001',
      }));
      expect(ordersGateway.emitOrderNew).toHaveBeenCalledWith(result);
      expect(tgNotifier.notifyNewOrder).toHaveBeenCalledWith(expect.objectContaining({
        sellerTelegramUsername: 'testseller',
        storeName: 'Test Store',
        total: 200,
        currency: 'UZS',
      }));
    });

    it('orderNumber имеет формат ORD-<ts>-<rand>', async () => {
      await useCase.execute({ buyerId: 'b-1', userId: 'u-1', dto: VALID_DTO });
      const orderArg = checkoutRepo.createOrder.mock.calls[0][0];
      expect(orderArg.orderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]{4}$/);
    });
  });
});
