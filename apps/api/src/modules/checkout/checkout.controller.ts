import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ConfirmCheckoutDto } from './dto/confirm-checkout.dto';
import { PreviewCheckoutUseCase } from './use-cases/preview-checkout.use-case';
import { ConfirmCheckoutUseCase } from './use-cases/confirm-checkout.use-case';
import { UsersRepository } from '../users/repositories/users.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { Idempotent } from '../../common/idempotency/idempotent.decorator';
import { IdempotencyInterceptor } from '../../common/idempotency/idempotency.interceptor';

@ApiTags('buyer')
@ApiBearerAuth('jwt')
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
  @ApiQuery({
    name: 'deliveryMode',
    required: false,
    enum: ['delivery', 'pickup'],
    description: 'Режим получения. pickup → deliveryFee = 0. Default delivery.',
  })
  async preview(
    @CurrentUser() user: JwtPayload,
    @Query('deliveryMode') deliveryMode?: string,
  ) {
    const buyerId = await this.resolveBuyerId(user.sub);
    // API-CHECKOUT-PICKUP-DELIVERY-FEE-001: невалидное значение трактуем как
    // delivery (backward-compat: старые клиенты вообще не шлют параметр).
    const mode = deliveryMode === 'pickup' ? 'pickup' : 'delivery';
    return this.previewCheckoutUseCase.execute({ buyerId, deliveryMode: mode });
  }

  // ─── POST /api/v1/checkout/confirm ─────────────────────────────────────────

  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // защита от спама заказов
  @Idempotent()
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Опциональный ключ once-only execution. Повторный запрос с тем же ключом + userId в течение 24h вернёт закэшированный ответ. Формат: 8-128 символов [A-Za-z0-9_:.-].',
  })
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
      paymentMethod: dto.paymentMethod,
      deliveryMode: dto.deliveryMode,
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
