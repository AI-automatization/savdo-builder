import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { CartRepository } from '../../cart/repositories/cart.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

export interface PreviewCheckoutInput {
  buyerId: string;
}

export interface PreviewItem {
  productId: string;
  variantId: string | null;
  productTitleSnapshot: string;
  variantLabelSnapshot: string | null;
  skuSnapshot: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface InvalidItem {
  productId: string;
  variantId: string | null;
  reason: string;
}

export interface CheckoutPreviewResult {
  valid: boolean;
  cartId: string;
  storeId: string;
  validItems: PreviewItem[];
  invalidItems: InvalidItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
}

@Injectable()
export class PreviewCheckoutUseCase {
  private readonly logger = new Logger(PreviewCheckoutUseCase.name);

  constructor(
    private readonly cartRepo: CartRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
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
    const invalidItems: InvalidItem[] = [];

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
          // Build variant label from option values
          const optionValues = (variant as any).optionValues ?? [];
          if (optionValues.length > 0) {
            variantLabelSnapshot = optionValues
              .map((ov: any) => ov.optionValue?.value ?? '')
              .filter(Boolean)
              .join(' / ');
          } else if ((variant as any).titleOverride) {
            variantLabelSnapshot = (variant as any).titleOverride;
          }
          skuSnapshot = (variant as any).sku ?? null;
        }
      }

      if (!itemInvalid) {
        validItems.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId ?? null,
          productTitleSnapshot: (product as any).title,
          variantLabelSnapshot,
          skuSnapshot,
          unitPrice,
          quantity: cartItem.quantity,
          lineTotal: unitPrice * cartItem.quantity,
        });
      }
    }

    const subtotal = validItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const deliveryFee = 0; // MVP: always 0, seller-defined later

    return {
      valid: invalidItems.length === 0,
      cartId: cart.id,
      storeId: cart.storeId,
      validItems,
      invalidItems,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      currency: cart.currencyCode,
    };
  }
}
