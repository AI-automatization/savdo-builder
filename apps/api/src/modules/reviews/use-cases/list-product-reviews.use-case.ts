import { Injectable } from '@nestjs/common';
import { ReviewsRepository } from '../repositories/reviews.repository';

export interface ListProductReviewsInput {
  productId: string;
  page?: number;
  limit?: number;
}

export interface ProductReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  /** Имя покупателя или маска телефона если firstName не задан */
  authorName: string;
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return 'Покупатель';
  // +998 90 123 45 67 → +998 *** ** ** 67
  const tail = phone.slice(-2);
  return `+998 *** ** ** ${tail}`;
}

@Injectable()
export class ListProductReviewsUseCase {
  constructor(private readonly reviewsRepo: ReviewsRepository) {}

  async execute(input: ListProductReviewsInput): Promise<{
    items: ProductReviewItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = input.page ?? 1;
    const limit = Math.min(input.limit ?? 20, 50);
    const { items, total } = await this.reviewsRepo.findByProductId(input.productId, page, limit);

    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        authorName: r.buyer?.firstName?.trim() || maskPhone(r.buyer?.user?.phone),
      })),
      total,
      page,
      limit,
    };
  }
}
