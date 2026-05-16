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
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermission } from '../../common/decorators/admin-permission.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

import { AdminRepository } from './repositories/admin.repository';
// ProductsRepository / ProductStatus инжектятся в AdminProductsController, не здесь.
import { OrdersRepository } from '../orders/repositories/orders.repository';
// ListUsersDto / ListSellersDto / ListStoresDto / AdminActionDto импортируются
// в Admin{Users,Sellers,Stores}Controller
import { ListAuditLogDto } from './dto/list-audit-log.dto';
// BroadcastDto импортируется в AdminBroadcastController

// 4 user + 2 seller use-cases инжектятся в Admin{Users,Sellers}Controller
// 8 store use-cases инжектятся в AdminStoresController, не здесь.
import { AdminCancelOrderUseCase } from './use-cases/admin-cancel-order.use-case';
import { GetAuditLogUseCase } from './use-cases/get-audit-log.use-case';
// GetAnalyticsUseCase инжектится в AdminAnalyticsController, не здесь.
// BroadcastUseCase инжектится в AdminBroadcastController, не здесь.
// DbManagerUseCase инжектится в AdminDbController, не здесь.
// AdminCreateSellerUseCase / AdminCreateStoreUseCase инжектятся
// в AdminUsersController / AdminSellersController
// GetSystemHealthUseCase и MigrateTgMediaToR2UseCase инжектятся
// в AdminOpsController, не здесь.

@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, AdminAccessGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly ordersRepo: OrdersRepository,
    private readonly adminCancelOrderUseCase: AdminCancelOrderUseCase,
    private readonly getAuditLogUseCase: GetAuditLogUseCase,
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

  // ── Users / Sellers / Stores эндпоинты вынесены в:
  //    - `AdminUsersController` (admin-users.controller.ts)
  //    - `AdminSellersController` (admin-sellers.controller.ts)
  //    - `AdminStoresController` (admin-stores.controller.ts)

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
