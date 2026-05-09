import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { AdminPermissionGuard } from '../../common/guards/admin-permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermission } from '../../common/decorators/admin-permission.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

import { AdminRepository } from './repositories/admin.repository';
// ProductsRepository / ProductStatus инжектятся в AdminProductsController, не здесь.
import { OrdersRepository } from '../orders/repositories/orders.repository';
import { ListUsersDto } from './dto/list-users.dto';
import { ListSellersDto } from './dto/list-sellers.dto';
import { ListStoresDto } from './dto/list-stores.dto';
import { AdminActionDto } from './dto/admin-action.dto';
import { ListAuditLogDto } from './dto/list-audit-log.dto';
// BroadcastDto импортируется в AdminBroadcastController

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
import { RejectStoreUseCase } from './use-cases/reject-store.use-case';
import { ArchiveStoreUseCase } from './use-cases/archive-store.use-case';
import { ApproveStoreUseCase } from './use-cases/approve-store.use-case';
import { UnapproveStoreUseCase } from './use-cases/unapprove-store.use-case';
import { AdminCancelOrderUseCase } from './use-cases/admin-cancel-order.use-case';
import { GetAuditLogUseCase } from './use-cases/get-audit-log.use-case';
// GetAnalyticsUseCase инжектится в AdminAnalyticsController, не здесь.
// BroadcastUseCase инжектится в AdminBroadcastController, не здесь.
// DbManagerUseCase инжектится в AdminDbController, не здесь.
import { AdminCreateSellerUseCase } from './use-cases/admin-create-seller.use-case';
import { AdminCreateStoreUseCase } from './use-cases/admin-create-store.use-case';
// GetSystemHealthUseCase и MigrateTgMediaToR2UseCase инжектятся
// в AdminOpsController, не здесь.

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly ordersRepo: OrdersRepository,
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
    private readonly rejectStoreUseCase: RejectStoreUseCase,
    private readonly archiveStoreUseCase: ArchiveStoreUseCase,
    private readonly approveStoreUseCase: ApproveStoreUseCase,
    private readonly unapproveStoreUseCase: UnapproveStoreUseCase,
    private readonly adminCancelOrderUseCase: AdminCancelOrderUseCase,
    private readonly getAuditLogUseCase: GetAuditLogUseCase,
    private readonly adminCreateSellerUseCase: AdminCreateSellerUseCase,
    private readonly adminCreateStoreUseCase: AdminCreateStoreUseCase,
  ) {}

  // ── System Health + Feature Flags + Media Migration вынесены в
  //    `AdminOpsController` (apps/api/src/modules/admin/admin-ops.controller.ts).

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
  @AdminPermission('user:suspend')
  async suspendUser(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.suspendUserUseCase.execute(id, user.sub, dto.reason);
  }

  @Post('users/:id/unsuspend')
  @AdminPermission('user:suspend')
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

  @Patch('sellers/:id/verify')
  @AdminPermission('seller:verify')
  async verifySeller(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const adminUser = await this.resolveAdminUser(user);
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

  // POST /api/v1/admin/users/:id/make-seller
  @Post('users/:id/make-seller')
  @AdminPermission('seller:create')
  async makeUserSeller(
    @Param('id') id: string,
    @Body() body: { fullName: string; sellerType: string; telegramUsername: string },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
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

  // POST /api/v1/admin/sellers/:id/create-store
  @Post('sellers/:id/create-store')
  @AdminPermission('store:create')
  async createStoreForSeller(
    @Param('id') id: string,
    @Body() body: { name: string; city: string; telegramContactLink: string; description?: string; region?: string; slug?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
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
  @AdminPermission('store:suspend')
  async suspendStore(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.suspendStoreUseCase.execute(id, user.sub, dto.reason);
  }

  @Post('stores/:id/unsuspend')
  @AdminPermission('store:suspend')
  async unsuspendStore(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.unsuspendStoreUseCase.execute(id, user.sub, dto.reason);
  }

  @Post('stores/:id/reject')
  @AdminPermission('store:moderate')
  async rejectStore(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.rejectStoreUseCase.execute(id, user.sub, dto.reason);
  }

  @Post('stores/:id/archive')
  @AdminPermission('store:archive')
  async archiveStore(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.archiveStoreUseCase.execute(id, user.sub, dto.reason);
  }

  @Post('stores/:id/approve')
  @AdminPermission('store:moderate')
  async approveStore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.approveStoreUseCase.execute(id, user.sub);
  }

  @Post('stores/:id/unapprove')
  @AdminPermission('store:moderate')
  async unapproveStore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.unapproveStoreUseCase.execute(id, user.sub);
  }

  // PATCH /api/v1/admin/orders/:id/status  { status: 'CANCELLED', reason: string }
  @Patch('orders/:id/status')
  @AdminPermission('order:cancel')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    if (status !== 'CANCELLED') {
      throw new DomainException(
        ErrorCode.ORDER_INVALID_TRANSITION,
        'Admin may only cancel orders via this endpoint',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return this.adminCancelOrderUseCase.execute(id, user.sub, reason ?? '');
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  // ── Analytics эндпоинты вынесены в AdminAnalyticsController
  //    (apps/api/src/modules/admin/admin-analytics.controller.ts).

  // ── Broadcast эндпоинты вынесены в AdminBroadcastController
  //    (apps/api/src/modules/admin/admin-broadcast.controller.ts).

  // ── Audit Log ─────────────────────────────────────────────────────────────

  @Get('audit-log')
  async getAuditLog(
    @Query() dto: ListAuditLogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.getAuditLogUseCase.execute(dto);
  }

  // ── Products эндпоинты вынесены в `AdminProductsController`
  //    (apps/api/src/modules/admin/admin-products.controller.ts).
  //    Заодно убран последний `'ARCHIVED' as any` каст -> `ProductStatus.ARCHIVED`.

  // ── Global search ──────────────────────────────────────────────────────────

  // GET /api/v1/admin/search?q=
  @Get('search')
  async search(
    @Query('q') q: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    if (!q || q.trim().length < 2) return { users: [], orders: [], stores: [] };
    return this.adminRepo.globalSearch(q.trim());
  }

  // ── Orders ─────────────────────────────────────────────────────────────────

  // GET /api/v1/admin/orders?status=&storeId=&search=&page=&limit=
  @Get('orders')
  async listOrders(
    @Query('status')  status:  string | undefined,
    @Query('storeId') storeId: string | undefined,
    @Query('page')    page:    string | undefined,
    @Query('limit')   limit:   string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);

    if (storeId) {
      const result = await this.ordersRepo.findByStoreId(storeId, {
        status: status as any,
        page:   page  ? Number(page)  : 1,
        limit:  limit ? Math.min(Number(limit), 100) : 20,
      });
      return result;
    }

    // All orders — use raw Prisma via admin repo
    return this.adminRepo.listOrders({
      status: status as any,
      page:   page  ? Number(page)  : 1,
      limit:  limit ? Math.min(Number(limit), 100) : 20,
    });
  }

  // ── Database Manager эндпоинты вынесены в `AdminDbController`
  //    (apps/api/src/modules/admin/admin-db.controller.ts).

  // db/tables/:table POST вынесен в AdminDbController
}
