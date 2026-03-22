import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '@prisma/client';
import { CartRepository } from '../../cart/repositories/cart.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';
import { CheckoutRepository } from '../repositories/checkout.repository';
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
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
    private readonly checkoutRepo: CheckoutRepository,
    private readonly config: ConfigService,
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

    // Validate all items — collect failures before aborting
    const validatedItems: Array<{
      productId: string;
      variantId?: string;
      productTitleSnapshot: string;
      variantLabelSnapshot?: string;
      skuSnapshot?: string;
      unitPriceSnapshot: number;
      quantity: number;
      lineTotalAmount: number;
    }> = [];

    const invalidItems: Array<{ productId: string; variantId: string | null; reason: string }> = [];

    for (const cartItem of cart.items) {
      const product = await this.productsRepo.findById(cartItem.productId);

      if (!product) {
        invalidItems.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId ?? null,
          reason: 'Product not found',
        });
        continue;
      }

      if ((product as any).status !== 'ACTIVE') {
        invalidItems.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId ?? null,
          reason: 'Product is no longer active',
        });
        continue;
      }

      let unitPrice = Number(cartItem.unitPriceSnapshot);
      let variantLabelSnapshot: string | undefined;
      let skuSnapshot: string | undefined;
      let itemInvalid = false;

      if (cartItem.variantId) {
        const variant = await this.variantsRepo.findById(cartItem.variantId);

        if (!variant) {
          invalidItems.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            reason: 'Variant not found',
          });
          itemInvalid = true;
        } else if (!(variant as any).isActive) {
          invalidItems.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            reason: 'Variant is no longer available',
          });
          itemInvalid = true;
        } else if ((variant as any).stockQuantity < cartItem.quantity) {
          invalidItems.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            reason: `Insufficient stock: available ${(variant as any).stockQuantity}, requested ${cartItem.quantity}`,
          });
          itemInvalid = true;
        } else {
          if (
            (variant as any).priceOverride !== null &&
            (variant as any).priceOverride !== undefined
          ) {
            unitPrice = Number((variant as any).priceOverride);
          }
          const optionValues = (variant as any).optionValues ?? [];
          if (optionValues.length > 0) {
            variantLabelSnapshot = optionValues
              .map((ov: any) => ov.optionValue?.value ?? '')
              .filter(Boolean)
              .join(' / ');
          } else if ((variant as any).titleOverride) {
            variantLabelSnapshot = (variant as any).titleOverride;
          }
          skuSnapshot = (variant as any).sku ?? undefined;
        }
      }

      if (!itemInvalid) {
        validatedItems.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId ?? undefined,
          productTitleSnapshot: (product as any).title,
          variantLabelSnapshot,
          skuSnapshot,
          unitPriceSnapshot: unitPrice,
          quantity: cartItem.quantity,
          lineTotalAmount: unitPrice * cartItem.quantity,
        });
      }
    }

    if (invalidItems.length > 0) {
      throw new DomainException(
        ErrorCode.CHECKOUT_ITEMS_UNAVAILABLE,
        'Some cart items are no longer available',
        HttpStatus.UNPROCESSABLE_ENTITY,
        { invalidItems } as unknown as Record<string, unknown>,
      );
    }

    const subtotalAmount = validatedItems.reduce((sum, item) => sum + item.lineTotalAmount, 0);
    const deliveryFeeAmount = input.deliveryFee ?? 0;
    const totalAmount = subtotalAmount + deliveryFeeAmount;

    const firstName = buyerWithUser.firstName ?? '';
    const lastName = buyerWithUser.lastName ?? '';
    const customerFullName = [firstName, lastName].filter(Boolean).join(' ') || buyerWithUser.user.phone;

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
      customerPhone: buyerWithUser.user.phone,
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

    return order;
  }
}
