import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order, PaymentMethod } from '@prisma/client';
import { CartRepository } from '../../cart/repositories/cart.repository';
import { CheckoutRepository } from '../repositories/checkout.repository';
import { ValidateCartItemsService } from '../services/validate-cart-items.service';
import { OrdersGateway } from '../../../socket/orders.gateway';
import { SellerNotificationService } from '../../telegram/services/seller-notification.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ErrorReporter } from '../../../shared/error-reporter';
import { computeDeliveryFee } from '../delivery-fee.util';
import { DeliveryAddressDto, PaymentMethod as PaymentMethodInput, DeliveryMode } from '../dto/confirm-checkout.dto';

export interface ConfirmCheckoutInput {
  buyerId: string;
  userId: string;
  isPhoneVerified: boolean;
  deliveryAddress: DeliveryAddressDto;
  buyerNote?: string;
  deliveryFee?: number;
  // BUG-WB-AUDIT-009: optional override от фронта (контактное лицо).
  customerFullName?: string;
  customerPhone?: string;
  // API-CHECKOUT-PAYMENT-METHOD-001: способ оплаты (cash/card/online).
  paymentMethod?: PaymentMethodInput;
  // API-CHECKOUT-PICKUP-DELIVERY-FEE-001: режим получения. pickup → fee 0.
  deliveryMode?: DeliveryMode;
}

/**
 * API-CHECKOUT-PAYMENT-METHOD-001: маппинг request-enum → Prisma-enum.
 *  cash   → COD (наличными при получении)
 *  card   → MANUAL_TRANSFER (картой курьеру / при получении)
 *  online → ONLINE (Click/Payme — только при PAYMENT_ONLINE_ENABLED)
 */
function resolvePaymentMethod(
  input: PaymentMethodInput | undefined,
  onlineEnabled: boolean,
): PaymentMethod {
  switch (input) {
    case 'card':
      return PaymentMethod.MANUAL_TRANSFER;
    case 'online':
      // Если онлайн-оплата выключена feature-flag'ом — деградируем на COD,
      // а не падаем. Фронт всё равно показывает «online» как «Скоро».
      return onlineEnabled ? PaymentMethod.ONLINE : PaymentMethod.COD;
    case 'cash':
    default:
      return PaymentMethod.COD;
  }
}

function generateOrderNumber(): string {
  // ORDER-NUM-001: crypto.randomBytes → collision-free при любом burst трафике.
  // Раньше Date.now()+Math.random() давал коллизии при конкурентных запросах
  // → Postgres UniqueConstraintViolation → HTTP 500 для покупателя.
  const { randomBytes } = require('crypto') as typeof import('crypto');
  return `ORD-${randomBytes(6).toString('hex').toUpperCase()}`;
}

@Injectable()
export class ConfirmCheckoutUseCase {
  private readonly logger = new Logger(ConfirmCheckoutUseCase.name);

  constructor(
    private readonly cartRepo: CartRepository,
    private readonly checkoutRepo: CheckoutRepository,
    private readonly validateItems: ValidateCartItemsService,
    private readonly config: ConfigService,
    private readonly ordersGateway: OrdersGateway,
    private readonly tgNotifier: SellerNotificationService,
  ) {}

  async execute(input: ConfirmCheckoutInput): Promise<Order> {
    // Feature flag: OTP required for checkout
    const otpRequired = this.config.get<boolean>('features.otpRequiredForCheckout', false);
    if (otpRequired && !input.isPhoneVerified) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Phone verification is required before checkout',
        HttpStatus.FORBIDDEN,
      );
    }

    // Re-validate cart atomically — cart may have changed since preview
    const cart = await this.cartRepo.findByBuyerId(input.buyerId);

    if (!cart || cart.items.length === 0) {
      throw new DomainException(
        ErrorCode.CART_EMPTY,
        'Cart is empty',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Resolve buyer profile for Order required fields
    const buyerWithUser = await this.checkoutRepo.findBuyerWithUser(input.buyerId);
    if (!buyerWithUser) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Buyer profile not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Resolve store to get sellerId
    const store = await this.checkoutRepo.findStoreWithSeller(cart.storeId);
    if (!store) {
      throw new DomainException(
        ErrorCode.STORE_NOT_FOUND,
        'Store not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Re-validate каждый item: product ACTIVE, variant принадлежит product +
    // isActive + stockQuantity. Может бросить CHECKOUT_ITEMS_UNAVAILABLE с
    // массивом invalidItems (UI показывает все сразу).
    const validatedItems = await this.validateItems.validate(
      cart.items.map((ci) => ({
        productId: ci.productId,
        variantId: ci.variantId ?? null,
        quantity: ci.quantity,
        unitPriceSnapshot: ci.unitPriceSnapshot,
      })),
    );

    // API-CHECKOUT-CONFIRM-500-001 (defensive): JS floating-point reduce даёт
    // значения типа 1234.5600000000001 — Prisma Decimal(12,2) принимает их, но
    // может бросить ValidationError если переполнение по precision. Округляем
    // на уровне application до cents.
    const round2 = (n: number): number => Math.round(n * 100) / 100;
    const subtotalAmount = round2(
      validatedItems.reduce((sum, item) => sum + Number(item.lineTotalAmount), 0),
    );

    // API-DELIVERY-FEE-CLIENT-CONTROLLED-001 + API-CHECKOUT-PREVIEW-DELIVERY-FEE-001:
    // backend сам считает deliveryFee из store.deliverySettings (input.deliveryFee
    // игнорируется, DTO оставлен для backward-compat). Тот же helper использует
    // preview — суммы preview и confirm всегда согласованы.
    // API-CHECKOUT-PICKUP-DELIVERY-FEE-001: при самовывозе (pickup) доставка не
    // оказывается → fee принудительно 0, store.deliverySettings не учитывается.
    const deliveryFeeAmount = round2(
      input.deliveryMode === 'pickup' ? 0 : computeDeliveryFee(store.deliverySettings),
    );
    const totalAmount = round2(subtotalAmount + deliveryFeeAmount);

    // API-CHECKOUT-CONFIRM-500-001 (defensive): Decimal(12,2) max 9 999 999 999.99 UZS.
    // Если total превысит — Prisma бросит RangeError. Защитная проверка ДО transaction.
    const DECIMAL_12_2_MAX = 9_999_999_999.99;
    if (totalAmount > DECIMAL_12_2_MAX || subtotalAmount > DECIMAL_12_2_MAX) {
      ErrorReporter.captureMessage(
        'Checkout amount exceeds Decimal(12,2) limit',
        'error',
        {
          source: 'confirm-checkout:amount-overflow',
          buyerId: input.buyerId,
          storeId: cart.storeId,
          subtotalAmount,
          deliveryFeeAmount,
          totalAmount,
          itemsCount: validatedItems.length,
        },
      );
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Order total exceeds maximum amount',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const firstName = buyerWithUser.firstName ?? '';
    const lastName = buyerWithUser.lastName ?? '';
    const profileFullName = [firstName, lastName].filter(Boolean).join(' ') || buyerWithUser.user.phone;
    // BUG-WB-AUDIT-009: фронт может передать override (юзер ввёл другое имя/тел
    // получателя). Иначе fallback на профиль.
    const customerFullName = input.customerFullName?.trim() || profileFullName;
    const customerPhone = input.customerPhone?.trim() || buyerWithUser.user.phone;

    // API-CHECKOUT-CONFIRM-500-001 (defensive): любая ошибка ВНУТРИ transaction
    // — это потенциальный root cause production 500. Захватываем полный
    // context для Sentry прежде чем re-throw, чтобы следующий 500 сразу
    // дал точку падения (Prisma error code, item with issue, etc).
    let order;
    try {
      order = await this.checkoutRepo.createOrder({
        buyerId: input.buyerId,
        storeId: cart.storeId,
        sellerId: store.sellerId,
        cartId: cart.id,
        orderNumber: generateOrderNumber(),
        subtotalAmount,
        deliveryFeeAmount,
        totalAmount,
        currencyCode: cart.currencyCode,
        customerFullName,
        customerPhone,
        customerComment: input.buyerNote,
        city: input.deliveryAddress.city,
        region: input.deliveryAddress.region,
        addressLine1: input.deliveryAddress.street,
        items: validatedItems,
        paymentMethod: resolvePaymentMethod(
          input.paymentMethod,
          this.config.get<boolean>('features.paymentOnlineEnabled', false),
        ),
      });
    } catch (err) {
      // DomainException — это уже наша ошибка с понятным кодом (CHECKOUT_STOCK_INSUFFICIENT
      // etc), не нужно репортить как exception. Только не-DomainException = реальный 500.
      if (!(err instanceof DomainException)) {
        ErrorReporter.captureException(err, {
          source: 'confirm-checkout:createOrder',
          buyerId: input.buyerId,
          storeId: cart.storeId,
          sellerId: store.sellerId,
          subtotalAmount,
          deliveryFeeAmount,
          totalAmount,
          currencyCode: cart.currencyCode,
          itemsCount: validatedItems.length,
          itemSummaries: validatedItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId ?? null,
            quantity: i.quantity,
            unitPriceSnapshot: i.unitPriceSnapshot,
            lineTotalAmount: i.lineTotalAmount,
          })),
          deliveryMode: input.deliveryMode ?? null,
        });
        this.logger.error(
          `confirm-checkout createOrder failed buyerId=${input.buyerId} storeId=${cart.storeId}: ${err instanceof Error ? err.message : String(err)}`,
          err instanceof Error ? err.stack : undefined,
        );
      }
      throw err;
    }

    // API-CHECKOUT-CONFIRM-500-001: заказ уже закоммичен транзакцией выше.
    // Всё что ниже — побочные эффекты (очистка корзины, WS-эмит, TG-нотификация).
    // Падение любого из них НЕ должно превращать успешно созданный заказ в
    // HTTP 500 — иначе buyer видит «ошибку оформления», хотя заказ реально
    // создан (и stock уже списан). Каждый side-effect изолирован try/catch.
    try {
      await this.cartRepo.clearCart(cart.id);
      await this.checkoutRepo.markCartConverted(cart.id);
    } catch (err) {
      ErrorReporter.captureException(err, {
        source: 'confirm-checkout:cart-cleanup',
        orderId: order.id,
      });
      this.logger.error(
        `Order ${order.orderNumber} created, but cart cleanup failed`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    this.logger.log(`Order ${order.orderNumber} created for buyer ${input.buyerId}`);

    try {
      this.ordersGateway.emitOrderNew(order);
    } catch (err) {
      ErrorReporter.captureException(err, {
        source: 'confirm-checkout:ws-emit',
        orderId: order.id,
      });
      this.logger.error(
        `Order ${order.orderNumber}: WS order:new emit failed`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    // TG notification → seller (fire-and-forget, never blocks).
    try {
      this.tgNotifier.notifyNewOrder({
        sellerTelegramUsername: store.seller.telegramUsername,
        orderNumber: order.orderNumber,
        storeName: store.name,
        itemCount: validatedItems.length,
        total: totalAmount,
        currency: cart.currencyCode,
        // MARKETING-LOCALIZATION-UZ-001: уведомление на языке продавца.
        locale: store.seller.user.languageCode ?? undefined,
      });
    } catch (err) {
      ErrorReporter.captureException(err, {
        source: 'confirm-checkout:tg-notify',
        orderId: order.id,
      });
    }

    return order;
  }
}
