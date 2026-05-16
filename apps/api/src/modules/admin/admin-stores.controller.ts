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
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermission } from '../../common/decorators/admin-permission.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

import { ListStoresDto } from './dto/list-stores.dto';
import { AdminActionDto } from './dto/admin-action.dto';

import { ListStoresUseCase } from './use-cases/list-stores.use-case';
import { GetStoreDetailUseCase } from './use-cases/get-store-detail.use-case';
import { SuspendStoreUseCase } from './use-cases/suspend-store.use-case';
import { UnsuspendStoreUseCase } from './use-cases/unsuspend-store.use-case';
import { RejectStoreUseCase } from './use-cases/reject-store.use-case';
import { ArchiveStoreUseCase } from './use-cases/archive-store.use-case';
import { ApproveStoreUseCase } from './use-cases/approve-store.use-case';
import { UnapproveStoreUseCase } from './use-cases/unapprove-store.use-case';
import { SetStoreVerificationUseCase } from './use-cases/set-store-verification.use-case';
import { AdminContextService } from './services/admin-context.service';

/**
 * AdminStoresController — модерация магазинов (8 routes).
 *
 * Subdomain: list/detail + suspend/unsuspend/reject/archive + approve/unapprove.
 * Все мутирующие действия идут через свой use-case (audit_log пишется внутри).
 *
 * Public routes /admin/stores* unchanged.
 */
@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin/stores')
@UseGuards(JwtAuthGuard, RolesGuard, AdminAccessGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminStoresController {
  constructor(
    private readonly adminContext: AdminContextService,
    private readonly listStoresUseCase: ListStoresUseCase,
    private readonly getStoreDetailUseCase: GetStoreDetailUseCase,
    private readonly suspendStoreUseCase: SuspendStoreUseCase,
    private readonly unsuspendStoreUseCase: UnsuspendStoreUseCase,
    private readonly rejectStoreUseCase: RejectStoreUseCase,
    private readonly archiveStoreUseCase: ArchiveStoreUseCase,
    private readonly approveStoreUseCase: ApproveStoreUseCase,
    private readonly unapproveStoreUseCase: UnapproveStoreUseCase,
    private readonly setStoreVerificationUseCase: SetStoreVerificationUseCase,
  ) {}

  @Get()
  async list(@Query() dto: ListStoresDto, @CurrentUser() user: JwtPayload) {
    await this.adminContext.requireAdmin(user);
    return this.listStoresUseCase.execute(dto);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.adminContext.requireAdmin(user);
    return this.getStoreDetailUseCase.execute(id);
  }

  @Post(':id/suspend')
  @AdminPermission('store:suspend')
  async suspend(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminContext.requireAdmin(user);
    return this.suspendStoreUseCase.execute(id, user.sub, dto.reason);
  }

  @Post(':id/unsuspend')
  @AdminPermission('store:suspend')
  async unsuspend(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminContext.requireAdmin(user);
    return this.unsuspendStoreUseCase.execute(id, user.sub, dto.reason);
  }

  @Post(':id/reject')
  @AdminPermission('store:moderate')
  async reject(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminContext.requireAdmin(user);
    return this.rejectStoreUseCase.execute(id, user.sub, dto.reason);
  }

  @Post(':id/archive')
  @AdminPermission('store:archive')
  async archive(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminContext.requireAdmin(user);
    return this.archiveStoreUseCase.execute(id, user.sub, dto.reason);
  }

  @Post(':id/approve')
  @AdminPermission('store:moderate')
  async approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.adminContext.requireAdmin(user);
    return this.approveStoreUseCase.execute(id, user.sub);
  }

  @Post(':id/unapprove')
  @AdminPermission('store:moderate')
  async unapprove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.adminContext.requireAdmin(user);
    return this.unapproveStoreUseCase.execute(id, user.sub);
  }

  // MARKETING-VERIFIED-SELLER-001: admin ставит «Verified» галочку
  @Post(':id/verify')
  @AdminPermission('store:moderate')
  async verify(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.adminContext.requireAdmin(user);
    return this.setStoreVerificationUseCase.execute({
      storeId: id,
      actorUserId: user.sub,
      isVerified: true,
    });
  }

  @Post(':id/unverify')
  @AdminPermission('store:moderate')
  async unverify(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminContext.requireAdmin(user);
    return this.setStoreVerificationUseCase.execute({
      storeId: id,
      actorUserId: user.sub,
      isVerified: false,
      reason: dto.reason,
    });
  }
}
