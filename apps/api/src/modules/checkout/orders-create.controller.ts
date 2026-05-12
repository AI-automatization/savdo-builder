import { Controller, Post, Body, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateDirectOrderDto } from './dto/create-direct-order.dto';
import { CreateDirectOrderUseCase } from './use-cases/create-direct-order.use-case';
import { UsersRepository } from '../users/repositories/users.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { Idempotent } from '../../common/idempotency/idempotent.decorator';
import { IdempotencyInterceptor } from '../../common/idempotency/idempotency.interceptor';

@Controller()
@UseGuards(JwtAuthGuard)
export class OrdersCreateController {
  constructor(
    private readonly createDirectOrderUseCase: CreateDirectOrderUseCase,
    private readonly usersRepo: UsersRepository,
  ) {}

  // POST /api/v1/orders — TMA direct order (items from localStorage, no backend cart required)
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // anti-spam, как /checkout/confirm
  @Idempotent()
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Опциональный ключ once-only execution (см. /checkout/confirm).',
  })
  async createOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDirectOrderDto,
  ) {
    const fullUser = await this.usersRepo.findById(user.sub);

    if (!fullUser || !fullUser.buyer) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Buyer profile not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.createDirectOrderUseCase.execute({
      buyerId: fullUser.buyer.id,
      userId: fullUser.id,
      dto,
    });
  }
}
