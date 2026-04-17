import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateDirectOrderDto } from './dto/create-direct-order.dto';
import { CreateDirectOrderUseCase } from './use-cases/create-direct-order.use-case';
import { UsersRepository } from '../users/repositories/users.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

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
