import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ConfirmCheckoutDto } from './dto/confirm-checkout.dto';
import { ConfirmCheckoutUseCase } from './use-cases/confirm-checkout.use-case';
import { UsersRepository } from '../users/repositories/users.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

@Controller()
@UseGuards(JwtAuthGuard)
export class OrdersCreateController {
  constructor(
    private readonly confirmCheckoutUseCase: ConfirmCheckoutUseCase,
    private readonly usersRepo: UsersRepository,
  ) {}

  // POST /api/v1/orders — alias for POST /api/v1/checkout/confirm
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConfirmCheckoutDto,
  ) {
    const fullUser = await this.usersRepo.findById(user.sub);

    if (!fullUser || !fullUser.buyer) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Buyer profile not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.confirmCheckoutUseCase.execute({
      buyerId: fullUser.buyer.id,
      userId: fullUser.id,
      isPhoneVerified: fullUser.isPhoneVerified,
      deliveryAddress: dto.deliveryAddress,
      buyerNote: dto.buyerNote,
      deliveryFee: dto.deliveryFee,
    });
  }
}
