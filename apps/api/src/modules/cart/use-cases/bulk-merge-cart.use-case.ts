import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { CartRepository } from '../repositories/cart.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { VariantsRepository } from '../../products/repositories/variants.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { MappedCart, mapCart, toNum } from '../cart.mapper';

export interface BulkMergeItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface BulkMergeInput {
  buyerId: string;
  items: BulkMergeItem[];
}

export interface BulkMergeResult {
  cart: MappedCart;
  imported: number;
  skipped: number;
}

/**
 * TMA-CART-API-SYNC-001: bulk-import items в buyer cart.
 *
 * Шаги:
 *   1. Валидируем все products + variants (skip невалидных).
 *   2. INV-C01: все items должны быть из одного store. Mismatch → 422.
 *   3. Если у buyer есть cart с другим store — clear + setStoreId (TMA cart wins).
 *   4. Add each item через addItem/updateItemQuantity (с дедупликацией по
 *      productId + variantId, qty суммируется max 100).
 *   5. Return mapped cart + статистика.
 *
 * Idempotency: повторный вызов с теми же items → quantity растёт. UI должен
 * вызывать только один раз после auth (флаг в localStorage).
 */
@Injectable()
export class BulkMergeCartUseCase {
  private readonly logger = new Logger(BulkMergeCartUseCase.name);

  constructor(
    private readonly cartRepo: CartRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
  ) {}

  async execute(input: BulkMergeInput): Promise<BulkMergeResult> {
    if (!input.items.length) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'items must not be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Batch fetch products + variants (no N+1).
    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const variantIds = [...new Set(input.items.map((i) => i.variantId).filter((v): v is string => !!v))];
    const [productMap, variantMap] = await Promise.all([
      this.productsRepo.findManyByIds(productIds),
      variantIds.length > 0 ? this.variantsRepo.findManyByIds(variantIds) : Promise.resolve(new Map()),
    ]);

    // Валидация + сбор валидных items.
    const valid: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
      unitPrice: number;
      salePrice: number | null;
      storeId: string;
    }> = [];
    let skipped = 0;

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product || product.status !== ProductStatus.ACTIVE || product.deletedAt) {
        skipped++;
        continue;
      }

      let unitPrice = toNum(product.basePrice);
      let variantId: string | null = null;
      const salePrice = product.salePrice != null ? toNum(product.salePrice) : null;

      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (
          !variant ||
          variant.productId !== product.id ||
          !variant.isActive ||
          variant.deletedAt
        ) {
          skipped++;
          continue;
        }
        variantId = variant.id;
        if (variant.priceOverride != null) {
          unitPrice = toNum(variant.priceOverride);
        }
      }

      valid.push({
        productId: product.id,
        variantId,
        quantity: item.quantity,
        unitPrice,
        salePrice,
        storeId: product.storeId,
      });
    }

    if (valid.length === 0) {
      throw new DomainException(
        ErrorCode.PRODUCT_NOT_FOUND,
        'No valid items in bulk-merge',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // INV-C01: все valid items должны быть из одного store.
    const storeIds = [...new Set(valid.map((v) => v.storeId))];
    if (storeIds.length > 1) {
      throw new DomainException(
        ErrorCode.CART_STORE_MISMATCH,
        'All items must belong to the same store (INV-C01)',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const targetStoreId = storeIds[0];

    // Resolve cart: existing buyer cart с тем же store → reuse; mismatch → clear + setStoreId.
    let cart = await this.cartRepo.findByBuyerId(input.buyerId);
    if (!cart) {
      const created = await this.cartRepo.createForBuyer(input.buyerId, targetStoreId);
      cart = await this.cartRepo.findById(created.id);
    } else if (cart.storeId !== targetStoreId) {
      this.logger.log(
        `Bulk-merge: store mismatch for buyer ${input.buyerId} (${cart.storeId} → ${targetStoreId}), clearing`,
      );
      await this.cartRepo.clearCart(cart.id);
      await this.cartRepo.setStoreId(cart.id, targetStoreId);
      cart = await this.cartRepo.findById(cart.id);
    }

    if (!cart) {
      throw new DomainException(
        ErrorCode.CART_NOT_FOUND,
        'Failed to resolve buyer cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Добавляем items (с дедупликацией).
    let imported = 0;
    for (const item of valid) {
      const existing = await this.cartRepo.findItemByProductAndVariant(
        cart.id,
        item.productId,
        item.variantId,
      );
      if (existing) {
        const newQty = Math.min(existing.quantity + item.quantity, 100);
        await this.cartRepo.updateItemQuantity(existing.id, newQty);
      } else {
        await this.cartRepo.addItem(cart.id, {
          productId: item.productId,
          variantId: item.variantId ?? undefined,
          quantity: Math.min(item.quantity, 100),
          unitPriceSnapshot: item.unitPrice,
          salePriceSnapshot: item.salePrice ?? undefined,
        });
      }
      imported++;
    }

    // Reload cart с актуальными items для return.
    const finalCart = await this.cartRepo.findById(cart.id);
    if (!finalCart) {
      throw new DomainException(
        ErrorCode.CART_NOT_FOUND,
        'Cart disappeared after merge',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      cart: mapCart(finalCart),
      imported,
      skipped,
    };
  }
}
