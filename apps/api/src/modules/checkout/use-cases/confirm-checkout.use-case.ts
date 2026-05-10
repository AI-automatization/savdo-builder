import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '@prisma/client';
import { CartRepository } from '../../cart/repositories/cart.repository';
import { CheckoutRepository } from '../repositories/checkout.repository';
import { ValidateCartItemsService } from '../services/validate-cart-items.service';
import { OrdersGateway } from '../../../socket/orders.gateway';
import { SellerNotificationService } from '../../telegram/services/seller-notification.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { DeliveryAddressDto } from '../dto/confirm-checkout.dto';

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
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
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

    const subtotalAmount = validatedItems.reduce((sum, item) => sum + item.lineTotalAmount, 0);
    const deliveryFeeAmount = input.deliveryFee ?? 0;
    const totalAmount = subtotalAmount + deliveryFeeAmount;

    const firstName = buyerWithUser.firstName ?? '';
    const lastName = buyerWithUser.lastName ?? '';
    const profileFullName = [firstName, lastName].filter(Boolean).join(' ') || buyerWithUser.user.phone;
    // BUG-WB-AUDIT-009: фронт может передать override (юзер ввёл другое имя/тел
    // получателя). Иначе fallback на профиль.
    const customerFullName = input.customerFullName?.trim() || profileFullName;
    const customerPhone = input.customerPhone?.trim() || buyerWithUser.user.phone;

    const order = await this.checkoutRepo.createOrder({
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
    });

    // Clear cart items and mark cart as converted
    await this.cartRepo.clearCart(cart.id);
    await this.checkoutRepo.markCartConverted(cart.id);

    this.logger.log(`Order ${order.orderNumber} created for buyer ${input.buyerId}`);

    this.ordersGateway.emitOrderNew(order);

    // TG notification → seller (fire-and-forget, never blocks)
    this.tgNotifier.notifyNewOrder({
      sellerTelegramUsername: store.seller.telegramUsername,
      orderNumber: order.orderNumber,
      storeName: store.name,
      itemCount: validatedItems.length,
      total: totalAmount,
      currency: cart.currencyCode,
    });

    return order;
  }
}
