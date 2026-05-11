import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { AdminPermissionGuard } from '../../common/guards/admin-permission.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermission } from '../../common/decorators/admin-permission.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

import { ListUsersDto } from './dto/list-users.dto';
import { AdminActionDto } from './dto/admin-action.dto';
import { ListUsersUseCase } from './use-cases/list-users.use-case';
import { GetUserDetailUseCase } from './use-cases/get-user-detail.use-case';
import { SuspendUserUseCase } from './use-cases/suspend-user.use-case';
import { UnsuspendUserUseCase } from './use-cases/unsuspend-user.use-case';
import { AdminCreateSellerUseCase } from './use-cases/admin-create-seller.use-case';
import { AdminRepository } from './repositories/admin.repository';
import { AdminContextService } from './services/admin-context.service';

/**
 * AdminUsersController — list/get + suspend/unsuspend + make-seller (5 routes).
 *
 * `make-seller` исторически прибит к /users/:id (не /sellers) — оставляем
 * совместимость, чтобы admin SPA не ломалась.
 */
@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(
    private readonly adminContext: AdminContextService,
    private readonly adminRepo: AdminRepository,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserDetailUseCase: GetUserDetailUseCase,
    private readonly suspendUserUseCase: SuspendUserUseCase,
    private readonly unsuspendUserUseCase: UnsuspendUserUseCase,
    private readonly adminCreateSellerUseCase: AdminCreateSellerUseCase,
  ) {}

  @Get()
  async list(@Query() dto: ListUsersDto, @CurrentUser() user: JwtPayload) {
    await this.adminContext.requireAdmin(user);
    return this.listUsersUseCase.execute(dto);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.adminContext.requireAdmin(user);
    return this.getUserDetailUseCase.execute(id);
  }

  @Post(':id/suspend')
  @AdminPermission('user:suspend')
  async suspend(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminContext.requireAdmin(user);
    return this.suspendUserUseCase.execute(id, user.sub, dto.reason);
  }

  @Post(':id/unsuspend')
  @AdminPermission('user:suspend')
  async unsuspend(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminContext.requireAdmin(user);
    return this.unsuspendUserUseCase.execute(id, user.sub, dto.reason);
  }

  // POST /api/v1/admin/users/:id/make-seller
  @Post(':id/make-seller')
  @AdminPermission('seller:create')
  async makeSeller(
    @Param('id') id: string,
    @Body() body: { fullName: string; sellerType: string; telegramUsername: string },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminContext.requireAdmin(user);
    const seller = await this.adminCreateSellerUseCase.execute({
      userId: id,
      fullName: body.fullName,
      sellerType: body.sellerType as 'individual' | 'business',
      telegramUsername: body.telegramUsername,
    });
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: 'admin.create_seller',
      entityType: 'seller',
      entityId: seller.id,
      payload: { userId: id, fullName: body.fullName },
    });
    return seller;
  }
}
