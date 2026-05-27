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

  /**
   * API-PRODUCT-DENORMALIZED-FIELDS-001: пересчитать `Product.hasVariants` и
   * `Product.totalStock` из текущих active variants (isActive=true, deletedAt=null).
   *
   * Контекст: hasVariants и totalStock — denormalized fields (как avgRating/reviewCount
   * для отзывов). Storefront читает их напрямую из DB. Если они расходятся с реальным
   * состоянием variants — UI скрывает variant-selector / показывает фейковый OOS.
   *
   * Вызывать после ЛЮБОЙ мутации variants (create/update/delete/adjustStock) внутри
   * той же транзакции что и сама мутация — чтобы консистентность гарантировалась.
   *
   * Edge case: если был variant и его удалили (variants=0), hasVariants → false,
   * но totalStock остаётся прежним (single-SKU stock не сбрасываем — seller сам
   * выставит). На практике seller обычно либо использует variants, либо нет — переход
   * редок.
   */
  async recalcProductFields(productId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    const agg = await client.productVariant.aggregate({
      where: { productId, deletedAt: null, isActive: true },
      _count: { _all: true },
      _sum: { stockQuantity: true },
    });
    const variantCount = agg._count._all;
    const hasVariants = variantCount > 0;
    const sumStock = agg._sum.stockQuantity ?? 0;
    // Если variants нет — totalStock не трогаем (single-SKU режим).
    const updateData: Prisma.ProductUpdateInput = hasVariants
      ? { hasVariants: true, totalStock: sumStock }
      : { hasVariants: false };
    await client.product.update({ where: { id: productId }, data: updateData });
  }

  /**
   * Batch backfill для всех products: пересчитать `hasVariants` + `totalStock`.
   * Используется одноразово после деплоя API-PRODUCT-DENORMALIZED-FIELDS-001
   * чтобы починить legacy rows которые накопились до фикса.
   *
   * Стратегия: один SQL UPDATE через raw для performance — иначе на 10K products
   * было бы 20K round-trips через Prisma (aggregate + update). Raw SQL гарантирует
   * атомарность batch операции.
   */
  async recalcAllProducts(): Promise<{ updated: number }> {
    // products с variants — выставляем агрегаты
    const withVariants = await this.prisma.$executeRaw`
      UPDATE products p SET
        has_variants = TRUE,
        total_stock = COALESCE(agg.sum_stock, 0)
      FROM (
        SELECT product_id, SUM(stock_quantity)::int AS sum_stock
        FROM product_variants
        WHERE deleted_at IS NULL AND is_active = TRUE
        GROUP BY product_id
      ) agg
      WHERE p.id = agg.product_id
    `;
    // products без active variants — выставляем hasVariants=false, totalStock не трогаем
    const withoutVariants = await this.prisma.$executeRaw`
      UPDATE products p SET has_variants = FALSE
      WHERE p.has_variants = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM product_variants v
          WHERE v.product_id = p.id AND v.deleted_at IS NULL AND v.is_active = TRUE
        )
    `;
    return { updated: Number(withVariants) + Number(withoutVariants) };
  }

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
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
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
      // API-PRODUCT-DENORMALIZED-FIELDS-001
      await this.recalcProductFields(productId, tx);
      return variant;
    });
  }

  async update(id: string, data: UpdateVariantData): Promise<ProductVariant> {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.update({
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
      // API-PRODUCT-DENORMALIZED-FIELDS-001: recalc если изменился stockQuantity или isActive
      if (data.stockQuantity !== undefined || data.isActive !== undefined) {
        await this.recalcProductFields(variant.productId, tx);
      }
      return variant;
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      // API-PRODUCT-DENORMALIZED-FIELDS-001
      await this.recalcProductFields(variant.productId, tx);
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

      // API-PRODUCT-DENORMALIZED-FIELDS-001: после каждого stock-движения
      // пересчитываем агрегат на Product чтобы storefront/cart видели актуальное
      // totalStock без on-the-fly recalc.
      await this.recalcProductFields(variant.productId, tx);

      return updated;
    });
  }
}
