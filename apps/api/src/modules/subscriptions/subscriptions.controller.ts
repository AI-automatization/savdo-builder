import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { GetCurrentSubscriptionUseCase } from './use-cases/get-current-subscription.use-case';
import { CancelSubscriptionUseCase } from './use-cases/cancel-subscription.use-case';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';

/**
 * Seller-facing subscriptions API.
 * BILLING-MACHINE-001.
 */
@ApiTags('seller')
@ApiBearerAuth('jwt')
@Controller('seller/subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
export class SubscriptionsController {
  constructor(
    private readonly getCurrent: GetCurrentSubscriptionUseCase,
    private readonly cancel: CancelSubscriptionUseCase,
  ) {}

  @Get()
  async current(@CurrentUser() user: JwtPayload) {
    return this.getCurrent.execute(user.sub);
  }

  @Post('cancel')
  async cancelOwn(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.cancel.executeBySeller(user.sub, dto.reason);
  }
}
