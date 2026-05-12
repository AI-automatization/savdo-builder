import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { toNum } from '../../cart/cart.mapper';

export interface CartItemInput {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPriceSnapshot: unknown; // Decimal | number — конвертируется через toNum
}

export interface ValidatedOrderItem {
  productId: string;
  variantId?: string;
  productTitleSnapshot: string;
  variantLabelSnapshot?: string;
  skuSnapshot?: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotalAmount: number;
}

/**
 * ValidateCartItemsService — валидация cart items при checkout.
 *
 * Выделено из confirm-checkout.use-case (Wave 13 split). Раньше эта логика
 * жила inline в 100-строчном цикле с 15+ `as any` cast'ами на product/variant.
 *
 * Контракт:
 * - product должен быть ACTIVE (no soft-deleted, no DRAFT/HIDDEN/ARCHIVED)
 * - variant (если указан) должен принадлежать тому же product, быть isActive
 *   и иметь достаточный stockQuantity
 * - priceOverride варианта переопределяет цену из cartItem snapshot
 * - variantLabel собирается из optionValues junctions (или titleOverride)
 *
 * При invalid items — кидает DomainException с массивом причин (не aborts
 * на первой ошибке, чтобы UI мог показать всё разом).
 */
@Injectable()
export class ValidateCartItemsService {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
  ) {}

  async validate(items: CartItemInput[]): Promise<ValidatedOrderItem[]> {
    const validated: ValidatedOrderItem[] = [];
    const invalid: Array<{ productId: string; variantId: string | null; reason: string }> = [];

    for (const cartItem of items) {
      const product = await this.productsRepo.findById(cartItem.productId);

      if (!product) {
        invalid.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          reason: 'Product not found',
        });
        continue;
      }

      if (product.status !== ProductStatus.ACTIVE) {
        invalid.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          reason: 'Product is no longer active',
        });
        continue;
      }

      let unitPrice = toNum(cartItem.unitPriceSnapshot);
      let variantLabelSnapshot: string | undefined;
      let skuSnapshot: string | undefined;
      let itemInvalid = false;

      if (cartItem.variantId) {
        const variant = await this.variantsRepo.findById(cartItem.variantId);

        if (!variant) {
          invalid.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            reason: 'Variant not found',
          });
          itemInvalid = true;
        } else if (variant.productId !== cartItem.productId) {
          invalid.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            reason: 'Variant does not belong to this product',
          });
          itemInvalid = true;
        } else if (!variant.isActive) {
          invalid.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            reason: 'Variant is no longer available',
          });
          itemInvalid = true;
        } else if (variant.stockQuantity < cartItem.quantity) {
          invalid.push({
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
          skuSnapshot = variant.sku ?? undefined;
        }
      }

      if (!itemInvalid) {
        validated.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId ?? undefined,
          productTitleSnapshot: product.title,
          variantLabelSnapshot,
          skuSnapshot,
          unitPriceSnapshot: unitPrice,
          quantity: cartItem.quantity,
          lineTotalAmount: unitPrice * cartItem.quantity,
        });
      }
    }

    if (invalid.length > 0) {
      throw new DomainException(
        ErrorCode.CHECKOUT_ITEMS_UNAVAILABLE,
        'Some cart items are no longer available',
        HttpStatus.UNPROCESSABLE_ENTITY,
        { invalidItems: invalid } as unknown as Record<string, unknown>,
      );
    }

    return validated;
  }
}
