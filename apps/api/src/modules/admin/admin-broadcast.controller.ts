import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { AdminPermissionGuard } from '../../common/guards/admin-permission.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermission } from '../../common/decorators/admin-permission.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

import { AdminRepository } from './repositories/admin.repository';
import { BroadcastDto } from './dto/broadcast.dto';
import { BroadcastUseCase } from './use-cases/broadcast.use-case';

/**
 * AdminBroadcastController — выделено из монолитного AdminController
 * (см. analiz/logs.md AUDIT-POLAT-ZONE-2026-05-09).
 *
 * Subdomain: рассылка через Telegram Bot. POST создаёт рассылку (audience:
 * all/sellers/buyers + preview_mode для dry-run), GET возвращает историю.
 *
 * Public routes /admin/broadcast unchanged.
 */
@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminBroadcastController {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly broadcastUseCase: BroadcastUseCase,
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

  // POST /api/v1/admin/broadcast
  @Post('broadcast')
  @AdminPermission('broadcast:create')
  async broadcast(
    @Body() dto: BroadcastDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    return this.broadcastUseCase.execute({
      message: dto.message,
      previewMode: dto.preview_mode ?? false,
      adminUserId: user.sub,
      audience: dto.audience,
    });
  }

  // GET /api/v1/admin/broadcast
  @Get('broadcast')
  async getBroadcastHistory(@CurrentUser() user: JwtPayload) {
    await this.requireAdmin(user);
    return this.broadcastUseCase.getHistory();
  }
}
