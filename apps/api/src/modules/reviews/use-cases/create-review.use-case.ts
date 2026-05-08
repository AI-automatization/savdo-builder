import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { PrismaService } from '../../../database/prisma.service';
import { ReviewsRepository } from '../repositories/reviews.repository';
import { UsersRepository } from '../../users/repositories/users.repository';

export interface CreateReviewInput {
  userId: string;
  orderId: string;
  orderItemId: string;
  rating: number;
  comment?: string;
}

/**
 * FEAT-008: создать отзыв на товар из доставленного заказа.
 *
 * Гарантии:
 *  - У юзера есть buyer-профиль (иначе ничего не покупал).
 *  - OrderItem принадлежит указанному order'у.
 *  - Order принадлежит buyer'у (иначе можно бы было оставить отзыв на чужой заказ).
 *  - Order.status = DELIVERED — отзыв до доставки = шум.
 *  - У OrderItem ещё нет отзыва (1:1 через unique-индекс — DB тоже защищает).
 *  - У OrderItem есть productId — на guest-checkout snapshot'ы без productId
 *    отзыв не имеет смысла (продавец мог удалить товар после).
 */
@Injectable()
export class CreateReviewUseCase {
  private readonly logger = new Logger(CreateReviewUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewsRepo: ReviewsRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async execute(input: CreateReviewInput) {
    const user = await this.usersRepo.findById(input.userId);
    const buyerId = user?.buyer?.id;
    if (!buyerId) {
      throw new DomainException(
        ErrorCode.BUYER_NOT_IDENTIFIED,
        'Buyer profile not found',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: input.orderItemId },
      include: { order: { select: { id: true, buyerId: true, status: true } } },
    });
    if (!orderItem || orderItem.orderId !== input.orderId) {
      throw new DomainException(
        ErrorCode.NOT_FOUND,
        'Order item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!orderItem.productId) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Cannot review a product that was deleted',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (orderItem.order.buyerId !== buyerId) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'This order does not belong to you',
        HttpStatus.FORBIDDEN,
      );
    }

    if (orderItem.order.status !== 'DELIVERED') {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'You can review only delivered orders',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const existing = await this.reviewsRepo.findByOrderItemId(input.orderItemId);
    if (existing) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Review already exists for this purchase',
        HttpStatus.CONFLICT,
      );
    }

    const review = await this.reviewsRepo.create({
      productId: orderItem.productId,
      buyerId,
      orderItemId: input.orderItemId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    });

    await this.reviewsRepo.refreshProductAggregate(orderItem.productId);

    this.logger.log(`Review ${review.id} created on product ${orderItem.productId} by buyer ${buyerId}`);

    return {
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    };
  }
}
