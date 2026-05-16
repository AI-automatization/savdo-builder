import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { AdminPermissionGuard } from '../../common/guards/admin-permission.guard';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermission } from '../../common/decorators/admin-permission.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

import { ListSellersDto } from './dto/list-sellers.dto';
import { ListSellersUseCase } from './use-cases/list-sellers.use-case';
import { GetSellerDetailUseCase } from './use-cases/get-seller-detail.use-case';
import { AdminCreateStoreUseCase } from './use-cases/admin-create-store.use-case';
import { AdminRepository } from './repositories/admin.repository';
import { AdminContextService } from './services/admin-context.service';

/**
 * AdminSellersController — list/get + verify + create-store (4 routes).
 *
 * `verify` использует AdminRepository.updateSellerVerification напрямую
 * (legacy путь, остаётся для backward compat). Полноценная верификация
 * с reason/notes/checkedRequirements — через VerifySellerExtendedUseCase
 * в SuperAdminController.
 */
@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin/sellers')
@UseGuards(JwtAuthGuard, RolesGuard, AdminAccessGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminSellersController {
  constructor(
    private readonly adminContext: AdminContextService,
    private readonly adminRepo: AdminRepository,
    private readonly listSellersUseCase: ListSellersUseCase,
    private readonly getSellerDetailUseCase: GetSellerDetailUseCase,
    private readonly adminCreateStoreUseCase: AdminCreateStoreUseCase,
  ) {}

  @Get()
  async list(@Query() dto: ListSellersDto, @CurrentUser() user: JwtPayload) {
    await this.adminContext.requireAdmin(user);
    return this.listSellersUseCase.execute(dto);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.adminContext.requireAdmin(user);
    return this.getSellerDetailUseCase.execute(id);
  }

  @Patch(':id/verify')
  @AdminPermission('seller:verify')
  async verify(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminContext.requireAdmin(user);
    const updated = await this.adminRepo.updateSellerVerification(id, status);
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: `seller.verification.${status.toLowerCase()}`,
      entityType: 'seller',
      entityId: id,
      payload: { status },
    });
    return updated;
  }

  // POST /api/v1/admin/sellers/:id/create-store
  @Post(':id/create-store')
  @AdminPermission('store:create')
  async createStore(
    @Param('id') id: string,
    @Body() body: { name: string; city: string; telegramContactLink: string; description?: string; region?: string; slug?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminContext.requireAdmin(user);
    const store = await this.adminCreateStoreUseCase.execute({
      sellerId: id,
      ...body,
    });
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: 'admin.create_store',
      entityType: 'store',
      entityId: store.id,
      payload: { sellerId: id, name: body.name, slug: store.slug },
    });
    return store;
  }
}
