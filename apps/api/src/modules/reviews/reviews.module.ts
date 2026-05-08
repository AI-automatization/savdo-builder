import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './repositories/reviews.repository';
import { CreateReviewUseCase } from './use-cases/create-review.use-case';
import { ListProductReviewsUseCase } from './use-cases/list-product-reviews.use-case';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ReviewsController],
  providers: [
    ReviewsRepository,
    CreateReviewUseCase,
    ListProductReviewsUseCase,
  ],
  exports: [ReviewsRepository],
})
export class ReviewsModule {}
