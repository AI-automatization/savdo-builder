import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewUseCase } from './use-cases/create-review.use-case';
import { ListProductReviewsUseCase } from './use-cases/list-product-reviews.use-case';

@Controller()
export class ReviewsController {
  constructor(
    private readonly createReview: CreateReviewUseCase,
    private readonly listReviews: ListProductReviewsUseCase,
  ) {}

  // POST /api/v1/buyer/orders/:orderId/items/:itemId/review
  // FEAT-008: buyer оставляет отзыв на купленный товар. Только DELIVERED заказы.
  @Post('buyer/orders/:orderId/items/:itemId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async create(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.createReview.execute({
      userId: user.sub,
      orderId,
      orderItemId: itemId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  // GET /api/v1/storefront/products/:id/reviews
  // Public — на странице товара показывается всем (включая гостям).
  @Get('storefront/products/:id/reviews')
  async listForProduct(
    @Param('id') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listReviews.execute({
      productId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}
