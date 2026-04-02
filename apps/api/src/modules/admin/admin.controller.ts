import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ProductsRepository } from '../products/repositories/products.repository';
import { OrdersRepository } from '../orders/repositories/orders.repository';
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
import { RejectStoreUseCase } from './use-cases/reject-store.use-case';
import { ArchiveStoreUseCase } from './use-cases/archive-store.use-case';
import { AdminCancelOrderUseCase } from './use-cases/admin-cancel-order.use-case';
import { GetAuditLogUseCase } from './use-cases/get-audit-log.use-case';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly productsRepo: ProductsRepository,
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
    private readonly adminCancelOrderUseCase: AdminCancelOrderUseCase,
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

  @Patch('sellers/:id/verify')
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

  @Post('stores/:id/reject')
  async rejectStore(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.rejectStoreUseCase.execute(id, user.sub, dto.reason);
  }

  @Post('stores/:id/archive')
  async archiveStore(
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.archiveStoreUseCase.execute(id, user.sub, dto.reason);
  }

  // PATCH /api/v1/admin/orders/:id/status  { status: 'CANCELLED', reason: string }
  @Patch('orders/:id/status')
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

  // ── Audit Log ─────────────────────────────────────────────────────────────

  @Get('audit-log')
  async getAuditLog(
    @Query() dto: ListAuditLogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    return this.getAuditLogUseCase.execute(dto);
  }

  // ── Products ───────────────────────────────────────────────────────────────

  // GET /api/v1/admin/products?storeId=&status=&page=&limit=
  @Get('products')
  async listProducts(
    @Query('storeId') storeId: string | undefined,
    @Query('status') status: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    const products = await this.productsRepo.findAll({
      storeId,
      status: status as any,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
    return products;
  }

  // PATCH /api/v1/admin/products/:id/hide
  @Patch('products/:id/hide')
  async hideProduct(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    const product = await this.productsRepo.findById(id);
    if (!product) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    return this.productsRepo.updateStatus(id, 'HIDDEN_BY_ADMIN' as any);
  }

  // PATCH /api/v1/admin/products/:id/restore
  @Patch('products/:id/restore')
  async restoreProduct(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    const product = await this.productsRepo.findById(id);
    if (!product) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    return this.productsRepo.updateStatus(id, 'ACTIVE' as any);
  }

  // PATCH /api/v1/admin/products/:id/archive
  @Patch('products/:id/archive')
  async archiveProduct(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.resolveAdminUser(user);
    const product = await this.productsRepo.findById(id);
    if (!product) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: 'PRODUCT_ARCHIVED',
      entityType: 'Product',
      entityId: id,
      payload: { previousStatus: product.status },
    });
    return this.productsRepo.updateStatus(id, 'ARCHIVED' as any);
  }

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
}
