import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderItemId(orderItemId: string) {
    return this.prisma.productReview.findUnique({ where: { orderItemId } });
  }

  async findByProductId(productId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.productReview.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          buyer: { select: { firstName: true, user: { select: { phone: true } } } },
        },
      }),
      this.prisma.productReview.count({ where: { productId } }),
    ]);
    return { items, total };
  }

  async create(data: {
    productId: string;
    buyerId: string;
    orderItemId: string;
    rating: number;
    comment?: string | null;
  }) {
    return this.prisma.productReview.create({ data });
  }

  /**
   * Пересчитывает avgRating + reviewCount на products. Дешевле чем триггер,
   * вызывается из use-case после insert/delete review (rare events).
   */
  async refreshProductAggregate(productId: string): Promise<void> {
    const agg = await this.prisma.productReview.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const avg = agg._avg.rating;
    const count = agg._count._all;
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: avg !== null ? Math.round(Number(avg) * 100) / 100 : null,
        reviewCount: count,
      },
    });
  }

  /**
   * MARKETING-VERIFIED-SELLER-001: пересчёт weighted avg на Store-level.
   * Считаем по уже денормализованным product-aggregates (быстрее чем
   * по сырым review'ам — особенно если у магазина 1000 товаров).
   * Если у магазина нет товаров с отзывами — avgRating=NULL, reviewCount=0.
   *
   * Вызывается после refreshProductAggregate(productId).
   */
  async refreshStoreAggregate(storeId: string): Promise<void> {
    const products = await this.prisma.product.findMany({
      where: { storeId, deletedAt: null, reviewCount: { gt: 0 } },
      select: { avgRating: true, reviewCount: true },
    });

    const totalReviews = products.reduce((sum, p) => sum + p.reviewCount, 0);
    const weightedSum = products.reduce(
      (sum, p) => sum + Number(p.avgRating ?? 0) * p.reviewCount,
      0,
    );
    const avg = totalReviews > 0 ? weightedSum / totalReviews : null;

    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        avgRating: avg !== null ? Math.round(avg * 100) / 100 : null,
        reviewCount: totalReviews,
      },
    });
  }
}
