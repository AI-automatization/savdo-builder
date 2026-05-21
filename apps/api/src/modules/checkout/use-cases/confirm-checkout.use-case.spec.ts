/**
 * Тесты для `ConfirmCheckoutUseCase` orchestrator.
 *
 * Items validation тестируется отдельно в validate-cart-items.service.spec.ts —
 * здесь мокаем сервис и проверяем только саму последовательность вызовов:
 *   OTP guard → load cart → load buyer/store → validate → create order →
 *   clear cart → emit socket → notify seller.
 *
 * Финансовый flow — критично что:
 *   - cart.items[] правильно мапятся в validateItems.validate(...)
 *   - subtotal = sum(lineTotalAmount), total = subtotal + deliveryFee
 *   - customerFullName/Phone override (BUG-WB-AUDIT-009)
 *   - cart очищается ТОЛЬКО после успешного createOrder
 */
import { ConfirmCheckoutUseCase } from './confirm-checkout.use-case';
import { CartRepository } from '../../cart/repositories/cart.repository';
import { CheckoutRepository } from '../repositories/checkout.repository';
import { ValidateCartItemsService } from '../services/validate-cart-items.service';
import { OrdersGateway } from '../../../socket/orders.gateway';
import { SellerNotificationService } from '../../telegram/services/seller-notification.service';
import { ConfigService } from '@nestjs/config';

const CART = {
  id: 'cart-1',
  storeId: 'store-1',
  currencyCode: 'UZS',
  items: [
    { productId: 'p-1', variantId: null, quantity: 2, unitPriceSnapshot: 500 },
  ],
};

const BUYER_WITH_USER = {
  id: 'buyer-1',
  firstName: 'Алишер',
  lastName: 'Каримов',
  user: { id: 'u-1', phone: '+998900000001' },
};

const STORE = {
  id: 'store-1',
  sellerId: 'seller-1',
  name: 'Тестовый магазин',
  seller: { telegramUsername: 'test_seller', user: { languageCode: 'ru' } },
  // API-DELIVERY-FEE-CLIENT-CONTROLLED-001: backend читает из deliverySettings.
  // По умолчанию none → 0. Тесты которые проверяют ненулевой deliveryFee
  // переопределяют через mockResolvedValueOnce с deliveryFeeType=fixed.
  deliverySettings: { deliveryFeeType: 'none', fixedDeliveryFee: null },
};

const VALIDATED_ITEMS = [{
  productId: 'p-1',
  productTitleSnapshot: 'iPhone 16',
  unitPriceSnapshot: 500,
  quantity: 2,
  lineTotalAmount: 1000,
}];

const ORDER = { id: 'order-1', orderNumber: 'ORD-XYZ', total: 1000 };

const VALID_INPUT = {
  buyerId: 'buyer-1',
  userId: 'u-1',
  isPhoneVerified: true,
  deliveryAddress: { country: 'UZ', city: 'Ташкент', region: 'Тошкент', street: 'ул. Навои 1' },
};

describe('ConfirmCheckoutUseCase', () => {
  let useCase: ConfirmCheckoutUseCase;
  let cartRepo: { findByBuyerId: jest.Mock; clearCart: jest.Mock };
  let checkoutRepo: {
    findBuyerWithUser: jest.Mock;
    findStoreWithSeller: jest.Mock;
    createOrder: jest.Mock;
    markCartConverted: jest.Mock;
  };
  let validateItems: { validate: jest.Mock };
  let config: { get: jest.Mock };
  let ordersGateway: { emitOrderNew: jest.Mock };
  let tgNotifier: { notifyNewOrder: jest.Mock };

  beforeEach(() => {
    cartRepo = {
      findByBuyerId: jest.fn().mockResolvedValue(CART),
      clearCart: jest.fn().mockResolvedValue(undefined),
    };
    checkoutRepo = {
      findBuyerWithUser: jest.fn().mockResolvedValue(BUYER_WITH_USER),
      findStoreWithSeller: jest.fn().mockResolvedValue(STORE),
      createOrder: jest.fn().mockResolvedValue(ORDER),
      markCartConverted: jest.fn().mockResolvedValue(undefined),
    };
    validateItems = { validate: jest.fn().mockResolvedValue(VALIDATED_ITEMS) };
    config = { get: jest.fn().mockReturnValue(false) }; // OTP_REQUIRED off
    ordersGateway = { emitOrderNew: jest.fn() };
    tgNotifier = { notifyNewOrder: jest.fn() };

    useCase = new ConfirmCheckoutUseCase(
      cartRepo as unknown as CartRepository,
      checkoutRepo as unknown as CheckoutRepository,
      validateItems as unknown as ValidateCartItemsService,
      config as unknown as ConfigService,
      ordersGateway as unknown as OrdersGateway,
      tgNotifier as unknown as SellerNotificationService,
    );
  });

  describe('preconditions', () => {
    it('OTP_REQUIRED включён + телефон не верифицирован → 403', async () => {
      config.get.mockReturnValue(true);
      await expect(useCase.execute({ ...VALID_INPUT, isPhoneVerified: false }))
        .rejects.toThrow(/Phone verification is required/);
      expect(cartRepo.findByBuyerId).not.toHaveBeenCalled();
    });

    it('OTP_REQUIRED включён + телефон верифицирован → проходит', async () => {
      config.get.mockReturnValue(true);
      await expect(useCase.execute(VALID_INPUT)).resolves.toEqual(ORDER);
    });

    it('пустая корзина → CART_EMPTY', async () => {
      cartRepo.findByBuyerId.mockResolvedValue({ ...CART, items: [] });
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(/Cart is empty/);
    });

    it('корзина не найдена → CART_EMPTY', async () => {
      cartRepo.findByBuyerId.mockResolvedValue(null);
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(/Cart is empty/);
    });

    it('buyer профиль не найден → 401', async () => {
      checkoutRepo.findBuyerWithUser.mockResolvedValue(null);
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(/Buyer profile not found/);
    });

    it('магазин не найден → 404', async () => {
      checkoutRepo.findStoreWithSeller.mockResolvedValue(null);
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(/Store not found/);
    });
  });

  describe('order creation', () => {
    it('store deliveryFeeType=fixed + fixedDeliveryFee → total включает', async () => {
      // API-DELIVERY-FEE-CLIENT-CONTROLLED-001: backend читает deliverySettings,
      // input.deliveryFee игнорируется (deprecated).
      checkoutRepo.findStoreWithSeller.mockResolvedValueOnce({
        ...STORE,
        deliverySettings: { deliveryFeeType: 'fixed', fixedDeliveryFee: 250 },
      });
      await useCase.execute({ ...VALID_INPUT, deliveryFee: 9999 }); // 9999 ignored
      expect(checkoutRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        subtotalAmount: 1000,
        deliveryFeeAmount: 250,
        totalAmount: 1250,
      }));
    });

    it('store без deliverySettings → deliveryFee=0', async () => {
      checkoutRepo.findStoreWithSeller.mockResolvedValueOnce({
        ...STORE,
        deliverySettings: null,
      });
      await useCase.execute(VALID_INPUT);
      expect(checkoutRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        deliveryFeeAmount: 0,
        totalAmount: 1000,
      }));
    });

    it('deliveryFeeType=manual → 0 (продавец проставит при confirm заказа)', async () => {
      checkoutRepo.findStoreWithSeller.mockResolvedValueOnce({
        ...STORE,
        deliverySettings: { deliveryFeeType: 'manual', fixedDeliveryFee: 500 },
      });
      await useCase.execute(VALID_INPUT);
      expect(checkoutRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        deliveryFeeAmount: 0,
      }));
    });

    it('input.deliveryFee игнорируется (защита от client-controlled fee)', async () => {
      await useCase.execute({ ...VALID_INPUT, deliveryFee: 99999 });
      expect(checkoutRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        deliveryFeeAmount: 0, // STORE по дефолту 'none'
        totalAmount: 1000,
      }));
    });

    it('customerFullName fallback на firstName + lastName из profile', async () => {
      await useCase.execute(VALID_INPUT);
      expect(checkoutRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        customerFullName: 'Алишер Каримов',
        customerPhone: '+998900000001',
      }));
    });

    it('BUG-WB-AUDIT-009: customerFullName/Phone override от фронта переопределяет profile', async () => {
      await useCase.execute({
        ...VALID_INPUT,
        customerFullName: 'Получатель Иванов',
        customerPhone: '+998900000002',
      });
      expect(checkoutRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        customerFullName: 'Получатель Иванов',
        customerPhone: '+998900000002',
      }));
    });

    it('пустые firstName/lastName → fallback на phone', async () => {
      checkoutRepo.findBuyerWithUser.mockResolvedValue({
        ...BUYER_WITH_USER, firstName: null, lastName: null,
      });
      await useCase.execute(VALID_INPUT);
      expect(checkoutRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        customerFullName: '+998900000001',
      }));
    });

    it('orderNumber уникальный (формат ORD-...)', async () => {
      await useCase.execute(VALID_INPUT);
      const arg = checkoutRepo.createOrder.mock.calls[0][0];
      expect(arg.orderNumber).toMatch(/^ORD-/);
    });

    it('передаёт city/region/street из deliveryAddress', async () => {
      await useCase.execute(VALID_INPUT);
      expect(checkoutRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        city: 'Ташкент',
        region: 'Тошкент',
        addressLine1: 'ул. Навои 1',
      }));
    });
  });

  describe('side effects', () => {
    it('cart очищается + помечается converted ПОСЛЕ createOrder', async () => {
      const callOrder: string[] = [];
      checkoutRepo.createOrder.mockImplementation(async () => {
        callOrder.push('createOrder');
        return ORDER;
      });
      cartRepo.clearCart.mockImplementation(async () => { callOrder.push('clearCart'); });
      checkoutRepo.markCartConverted.mockImplementation(async () => { callOrder.push('markConverted'); });

      await useCase.execute(VALID_INPUT);
      expect(callOrder).toEqual(['createOrder', 'clearCart', 'markConverted']);
    });

    it('emitOrderNew вызывается с созданным order', async () => {
      await useCase.execute(VALID_INPUT);
      expect(ordersGateway.emitOrderNew).toHaveBeenCalledWith(ORDER);
    });

    it('TG notification → seller.telegramUsername с правильными полями', async () => {
      checkoutRepo.findStoreWithSeller.mockResolvedValueOnce({
        ...STORE,
        deliverySettings: { deliveryFeeType: 'fixed', fixedDeliveryFee: 100 },
      });
      await useCase.execute(VALID_INPUT);
      expect(tgNotifier.notifyNewOrder).toHaveBeenCalledWith({
        sellerTelegramUsername: 'test_seller',
        orderNumber: 'ORD-XYZ',
        storeName: 'Тестовый магазин',
        itemCount: 1,
        total: 1100,
        currency: 'UZS',
        locale: 'ru',
      });
    });

    it('createOrder упал → cart НЕ очищается, notification НЕ шлётся', async () => {
      checkoutRepo.createOrder.mockRejectedValue(new Error('DB down'));
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow();
      expect(cartRepo.clearCart).not.toHaveBeenCalled();
      expect(checkoutRepo.markCartConverted).not.toHaveBeenCalled();
      expect(ordersGateway.emitOrderNew).not.toHaveBeenCalled();
      expect(tgNotifier.notifyNewOrder).not.toHaveBeenCalled();
    });
  });

  describe('items validation integration', () => {
    it('передаёт items с unitPriceSnapshot из cartItem в validate()', async () => {
      await useCase.execute(VALID_INPUT);
      expect(validateItems.validate).toHaveBeenCalledWith([
        { productId: 'p-1', variantId: null, quantity: 2, unitPriceSnapshot: 500 },
      ]);
    });

    it('validate() throws → orchestrator пробрасывает + НЕ создаёт order', async () => {
      validateItems.validate.mockRejectedValue(new Error('CHECKOUT_ITEMS_UNAVAILABLE'));
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow();
      expect(checkoutRepo.createOrder).not.toHaveBeenCalled();
      expect(cartRepo.clearCart).not.toHaveBeenCalled();
    });
  });
});
