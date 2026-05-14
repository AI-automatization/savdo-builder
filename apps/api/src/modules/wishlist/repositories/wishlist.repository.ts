import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class WishlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List buyer's wishlist with embedded product preview.
   * Excludes products that have been deleted (deletedAt set) — entries persist
   * but are filtered out so they don't show as broken cards.
   */
  async findByBuyerId(buyerId: string) {
    return this.prisma.buyerWishlistItem.findMany({
      where: {
        buyerId,
        product: { deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            basePrice: true,
            currencyCode: true,
            displayType: true,
            status: true,
            isVisible: true,
            storeId: true,
            store: {
              select: { id: true, name: true, slug: true, status: true, isPublic: true },
            },
            images: {
              take: 1,
              orderBy: { sortOrder: 'asc' },
              include: {
                media: { select: { id: true, objectKey: true, bucket: true } },
              },
            },
          },
        },
      },
    });
  }

  async exists(buyerId: string, productId: string): Promise<boolean> {
    const found = await this.prisma.buyerWishlistItem.findUnique({
      where: { buyerId_productId: { buyerId, productId } },
      select: { id: true },
    });
    return !!found;
  }

  async create(
    buyerId: string,
    productId: string,
    snapshot?: { priceSnapshot?: Prisma.Decimal | number | null; inStockSnapshot?: boolean },
  ) {
    // MARKETING-WISHLIST-NOTIFY-001: при добавлении сохраняем snapshot
    // цены и доступности — нужно для cron-нотификаций (price-drop /
    // back-in-stock). Re-add (upsert update) тоже обновляет snapshot —
    // иначе старая цена «застрянет».
    const data = {
      priceSnapshot: snapshot?.priceSnapshot ?? undefined,
      inStockSnapshot: snapshot?.inStockSnapshot ?? undefined,
    };
    return this.prisma.buyerWishlistItem.upsert({
      where: { buyerId_productId: { buyerId, productId } },
      create: { buyerId, productId, ...data },
      update: {
        ...data,
        // Сбрасываем cooldown — после re-add можно снова получить nudge.
        notifiedAt: null,
        notifiedReason: null,
      },
    });
  }

  async delete(buyerId: string, productId: string): Promise<void> {
    await this.prisma.buyerWishlistItem
      .delete({
        where: { buyerId_productId: { buyerId, productId } },
      })
      .catch(() => {
        /* idempotent — silently ignore if already removed */
      });
  }

  /**
   * Returns set of productIds currently in this buyer's wishlist, given a list
   * of candidate productIds. Used by storefront feed to set inWishlist flag.
   */
  async findExistingProductIds(
    buyerId: string,
    productIds: string[],
  ): Promise<Set<string>> {
    if (!productIds.length) return new Set();
    const rows = await this.prisma.buyerWishlistItem.findMany({
      where: { buyerId, productId: { in: productIds } },
      select: { productId: true },
    });
    return new Set(rows.map((r) => r.productId));
  }
}
