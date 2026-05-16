import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { CartRepository } from '../../cart/repositories/cart.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';
import { CheckoutRepository } from '../repositories/checkout.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { toNum } from '../../cart/cart.mapper';
import { computeDeliveryFee } from '../delivery-fee.util';

export interface PreviewCheckoutInput {
  buyerId: string;
  // API-CHECKOUT-PICKUP-DELIVERY-FEE-001: режим получения. pickup → fee 0.
  // preview и confirm считают доставку одинаково, чтобы суммы совпадали.
  deliveryMode?: 'delivery' | 'pickup';
}

export interface PreviewItem {
  productId: string;
  variantId: string | null;
  title: string;
  variantTitle: string | null;
  skuSnapshot: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CheckoutPreviewResult {
  valid: boolean;
  cartId: string;
  storeId: string;
  items: PreviewItem[];
  stockWarnings: string[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currencyCode: string;
}

@Injectable()
export class PreviewCheckoutUseCase {
  private readonly logger = new Logger(PreviewCheckoutUseCase.name);

  constructor(
    private readonly cartRepo: CartRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
    private readonly checkoutRepo: CheckoutRepository,
  ) {}

  async execute(input: PreviewCheckoutInput): Promise<CheckoutPreviewResult> {
    const cart = await this.cartRepo.findByBuyerId(input.buyerId);

    if (!cart || cart.items.length === 0) {
      throw new DomainException(
        ErrorCode.CART_EMPTY,
        'Cart is empty',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const validItems: PreviewItem[] = [];
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

      if (product.status !== ProductStatus.ACTIVE) {
        invalidItems.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId ?? null,
          reason: 'Product is no longer active',
        });
        continue;
      }

      let unitPrice = toNum(cartItem.unitPriceSnapshot);
      let variantLabelSnapshot: string | null = null;
      let skuSnapshot: string | null = null;
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
        } else if (!variant.isActive) {
          invalidItems.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            reason: 'Variant is no longer available',
          });
          itemInvalid = true;
        } else if (variant.stockQuantity < cartItem.quantity) {
          invalidItems.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            reason: `Insufficient stock: available ${variant.stockQuantity}, requested ${cartItem.quantity}`,
          });
          itemInvalid = true;
        } else {
          if (variant.priceOverride !== null && variant.priceOverride !== undefined) {
            unitPrice = toNum(variant.priceOverride);
          }
          if (variant.optionValues.length > 0) {
            variantLabelSnapshot = variant.optionValues
              .map((ov) => ov.optionValue?.value ?? '')
              .filter(Boolean)
              .join(' / ');
          } else if (variant.titleOverride) {
            variantLabelSnapshot = variant.titleOverride;
          }
          skuSnapshot = variant.sku ?? null;
        }
      }

      if (!itemInvalid) {
        validItems.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId ?? null,
          title: product.title,
          variantTitle: variantLabelSnapshot,
          skuSnapshot,
          unitPrice,
          quantity: cartItem.quantity,
          subtotal: unitPrice * cartItem.quantity,
        });
      }
    }

    const subtotal = validItems.reduce((sum, item) => sum + item.subtotal, 0);
    // API-CHECKOUT-PREVIEW-DELIVERY-FEE-001: реальная плата за доставку из
    // store.deliverySettings — тот же computeDeliveryFee, что и confirm-checkout.
    // Раньше хардкодили 0 → preview показывал «Бесплатно», confirm списывал
    // fixed-плату (WB-B01).
    // API-CHECKOUT-PICKUP-DELIVERY-FEE-001: при самовывозе доставка не оказывается.
    const store = await this.checkoutRepo.findStoreWithSeller(cart.storeId);
    const deliveryFee =
      input.deliveryMode === 'pickup' ? 0 : computeDeliveryFee(store?.deliverySettings);
    const stockWarnings = invalidItems.map((i) => i.reason);

    return {
      valid: invalidItems.length === 0,
      cartId: cart.id,
      storeId: cart.storeId,
      items: validItems,
      stockWarnings,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      currencyCode: cart.currencyCode,
    };
  }
}
