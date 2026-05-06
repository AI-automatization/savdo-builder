import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ConfirmCheckoutDto } from './dto/confirm-checkout.dto';
import { PreviewCheckoutUseCase } from './use-cases/preview-checkout.use-case';
import { ConfirmCheckoutUseCase } from './use-cases/confirm-checkout.use-case';
import { UsersRepository } from '../users/repositories/users.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(
    private readonly previewCheckoutUseCase: PreviewCheckoutUseCase,
    private readonly confirmCheckoutUseCase: ConfirmCheckoutUseCase,
    private readonly usersRepo: UsersRepository,
  ) {}

  // ─── GET /api/v1/checkout/preview ──────────────────────────────────────────

  @Get('preview')
  async preview(@CurrentUser() user: JwtPayload) {
    const buyerId = await this.resolveBuyerId(user.sub);
    return this.previewCheckoutUseCase.execute({ buyerId });
  }

  // ─── POST /api/v1/checkout/confirm ─────────────────────────────────────────

  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // защита от спама заказов
  async confirm(
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
      customerFullName: dto.customerFullName,
      customerPhone: dto.customerPhone,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async resolveBuyerId(userId: string): Promise<string> {
    const fullUser = await this.usersRepo.findById(userId);

    if (!fullUser || !fullUser.buyer) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Buyer profile not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return fullUser.buyer.id;
  }
}
