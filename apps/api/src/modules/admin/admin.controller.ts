import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

import { AdminRepository } from './repositories/admin.repository';
import { ListUsersDto } from './dto/list-users.dto';
import { ListSellersDto } from './dto/list-sellers.dto';
import { ListStoresDto } from './dto/list-stores.dto';
import { AdminActionDto } from './dto/admin-action.dto';
import { ListAuditLogDto } from './dto/list-audit-log.dto';

import { ListUsersUseCase } from './use-cases/list-users.use-case';
import { GetUserDetailUseCase } from './use-cases/get-user-detail.use-case';
import { SuspendUserUseCase } from './use-cases/suspend-user.use-case';
import { UnsuspendUserUseCase } from './use-cases/unsuspend-user.use-case';
import { ListSellersUseCase } from './use-cases/list-sellers.use-case';
import { GetSellerDetailUseCase } from './use-cases/get-seller-detail.use-case';
import { ListStoresUseCase } from './use-cases/list-stores.use-case';
import { GetStoreDetailUseCase } from './use-cases/get-store-detail.use-case';
import { SuspendStoreUseCase } from './use-cases/suspend-store.use-case';
import { UnsuspendStoreUseCase } from './use-cases/unsuspend-store.use-case';
import { GetAuditLogUseCase } from './use-cases/get-audit-log.use-case';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserDetailUseCase: GetUserDetailUseCase,
    private readonly suspendUserUseCase: SuspendUserUseCase,
    private readonly unsuspendUserUseCase: UnsuspendUserUseCase,
    private readonly listSellersUseCase: ListSellersUseCase,
    private readonly getSellerDetailUseCase: GetSellerDetailUseCase,
    private readonly listStoresUseCase: ListStoresUseCase,
    private readonly getStoreDetailUseCase: GetStoreDetailUseCase,
    private readonly suspendStoreUseCase: SuspendStoreUseCase,
    private readonly unsuspendStoreUseCase: UnsuspendStoreUseCase,
    private readonly getAuditLogUseCase: GetAuditLogUseCase,
  ) {}

  // Resolve AdminUser record from JWT payload.
  // Throws ADMIN_NOT_FOUND if the caller has role=ADMIN in JWT but no AdminUser row.
  private async resolveAdminUser(user: JwtPayload) {
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

  // ── Users ─────────────────────────────────────────────────────────────────

  @Get('users')
  async listUsers(
    @Query() dto: ListUsersDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.listUsersUseCase.execute(dto);
  }

  @Get('users/:id')
  async getUserDetail(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.getUserDetailUseCase.execute(id);
  }

  @Post('users/:id/suspend')
  async suspendUser(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.suspendUserUseCase.execute(id, user.sub, dto.reason);
  }

  @Post('users/:id/unsuspend')
  async unsuspendUser(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.unsuspendUserUseCase.execute(id, user.sub, dto.reason);
  }

  // ── Sellers ───────────────────────────────────────────────────────────────

  @Get('sellers')
  async listSellers(
    @Query() dto: ListSellersDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.listSellersUseCase.execute(dto);
  }

  @Get('sellers/:id')
  async getSellerDetail(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.getSellerDetailUseCase.execute(id);
  }

  // ── Stores ────────────────────────────────────────────────────────────────

  @Get('stores')
  async listStores(
    @Query() dto: ListStoresDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.listStoresUseCase.execute(dto);
  }

  @Get('stores/:id')
  async getStoreDetail(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.getStoreDetailUseCase.execute(id);
  }

  @Post('stores/:id/suspend')
  async suspendStore(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.suspendStoreUseCase.execute(id, user.sub, dto.reason);
  }

  @Post('stores/:id/unsuspend')
  async unsuspendStore(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.unsuspendStoreUseCase.execute(id, user.sub, dto.reason);
  }

  // ── Audit Log ─────────────────────────────────────────────────────────────

  @Get('audit-log')
  async getAuditLog(
    @Query() dto: ListAuditLogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.getAuditLogUseCase.execute(dto);
  }
}
