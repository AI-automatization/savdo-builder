import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, ProductVariant, InventoryMovementType } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

// Variant + optionValues junctions с подгруженным optionValue (для variantLabel
// рендера в checkout flow). Раньше код использовал `as any` на каждое поле.
const variantWithOptionsInclude = Prisma.validator<Prisma.ProductVariantInclude>()({
  optionValues: { include: { optionValue: true } },
});

export type VariantWithOptions = Prisma.ProductVariantGetPayload<{
  include: typeof variantWithOptionsInclude;
}>;

export interface CreateVariantData {
  sku: string;
  priceOverride?: number;
  stockQuantity?: number;
  isActive?: boolean;
  sortOrder?: number;
  titleOverride?: string;
  optionValueIds?: string[];
}

export interface UpdateVariantData {
  sku?: string;
  priceOverride?: number;
  stockQuantity?: number;
  isActive?: boolean;
  sortOrder?: number;
  titleOverride?: string;
}

@Injectable()
export class VariantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    return this.prisma.productVariant.findMany({
      where: { productId, deletedAt: null },
      include: {
        optionValues: { include: { optionValue: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<VariantWithOptions | null> {
    return this.prisma.productVariant.findFirst({
      where: { id, deletedAt: null },
      include: variantWithOptionsInclude,
    });
  }

  /**
   * API-N1-CHECKOUT-001: batch fetch для CreateDirectOrder и similar flows.
   * Раньше Promise.all(items.map(findById)) → N round-trips. Теперь один
   * SELECT с IN. Возвращает Map для O(1) lookup в caller.
   */
  async findManyByIds(ids: string[]): Promise<Map<string, VariantWithOptions>> {
    if (ids.length === 0) return new Map();
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: variantWithOptionsInclude,
    });
    return new Map(variants.map((v) => [v.id, v as VariantWithOptions]));
  }

  async create(productId: string, data: CreateVariantData): Promise<ProductVariant> {
    return this.prisma.productVariant.create({
      data: {
        productId,
        sku: data.sku,
        priceOverride: data.priceOverride,
        stockQuantity: data.stockQuantity ?? 0,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        titleOverride: data.titleOverride,
        ...(data.optionValueIds && data.optionValueIds.length > 0
          ? {
              optionValues: {
                create: data.optionValueIds.map((optionValueId) => ({ optionValueId })),
              },
            }
          : {}),
      },
      include: {
        optionValues: { include: { optionValue: true } },
      },
    });
  }

  async update(id: string, data: UpdateVariantData): Promise<ProductVariant> {
    return this.prisma.productVariant.update({
      where: { id },
      data: {
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.priceOverride !== undefined && { priceOverride: data.priceOverride }),
        ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.titleOverride !== undefined && { titleOverride: data.titleOverride }),
      },
      include: {
        optionValues: { include: { optionValue: true } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productVariant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async adjustStock(
    variantId: string,
    delta: number,
    reason: string,
    orderId?: string,
  ): Promise<ProductVariant> {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { id: variantId, deletedAt: null },
      });

      if (!variant) {
        throw new DomainException(
          ErrorCode.VARIANT_NOT_FOUND,
          'Variant not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const newStock = variant.stockQuantity + delta;

      if (newStock < 0) {
        throw new DomainException(
          ErrorCode.INSUFFICIENT_STOCK,
          `Insufficient stock: current ${variant.stockQuantity}, requested delta ${delta}`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity: newStock },
        include: {
          optionValues: { include: { optionValue: true } },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: variant.productId,
          variantId,
          movementType: orderId
            ? (delta < 0
                ? InventoryMovementType.ORDER_DEDUCTED
                : InventoryMovementType.ORDER_RELEASED)
            : InventoryMovementType.MANUAL_ADJUSTMENT,
          quantityDelta: delta,
          referenceType: orderId ? 'order' : 'seller',
          referenceId: orderId ?? null,
          note: reason,
        },
      });

      return updated;
    });
  }
}
