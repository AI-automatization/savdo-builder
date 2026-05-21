import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { AdminPermissionGuard } from '../../common/guards/admin-permission.guard';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

import { AdminRepository } from './repositories/admin.repository';
import { GetAnalyticsUseCase } from './use-cases/get-analytics.use-case';

/**
 * AdminAnalyticsController — выделено из AdminController.
 *
 * Subdomain: dashboard analytics — KPI summary (sellers/stores/orders/revenue
 * counters) + event log feed (analytics_events table).
 *
 * Public routes /admin/analytics/* unchanged.
 */
@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard, AdminAccessGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminAnalyticsController {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly getAnalyticsUseCase: GetAnalyticsUseCase,
  ) {}

  private async requireAdmin(user: JwtPayload) {
    const adminUser = await this.adminRepo.findAdminByUserId(user.sub);
    if (!adminUser) {
      throw new DomainException(
        ErrorCode.ADMIN_NOT_FOUND,
        'Admin record not found for this user',
        HttpStatus.FORBIDDEN,
      );
    }
    return adminUser;
  }

  // GET /api/v1/admin/analytics/summary
  @Get('summary')
  async getSummary(@CurrentUser() user: JwtPayload) {
    await this.requireAdmin(user);
    return this.getAnalyticsUseCase.execute();
  }

  // GET /api/v1/admin/analytics/events?page=&limit=&eventName=&storeId=
  @Get('events')
  async getEvents(
    @CurrentUser() user: JwtPayload,
    @Query('page')      page      = '1',
    @Query('limit')     limit     = '50',
    @Query('eventName') eventName?: string,
    @Query('storeId')   storeId?: string,
  ) {
    await this.requireAdmin(user);
    return this.getAnalyticsUseCase.getEvents({
      page:      Math.max(Number(page)  || 1,  1),
      limit:     Math.min(Number(limit) || 50, 100),
      eventName: eventName || undefined,
      storeId:   storeId   || undefined,
    });
  }
}
