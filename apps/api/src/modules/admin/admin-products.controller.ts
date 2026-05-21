import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
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
import { ProductsRepository } from '../products/repositories/products.repository';

/**
 * AdminProductsController — модерация товаров.
 *
 * Subdomain: list (с фильтром по storeId/status), hide / restore / archive
 * (изменение ProductStatus), force delete (soft через `productsRepo.delete`).
 *
 * Все мутирующие действия пишут audit_log с действием PRODUCT_<OP>.
 *
 * Public routes /admin/products* unchanged.
 */
@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard, AdminAccessGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminProductsController {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly productsRepo: ProductsRepository,
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

  private async requireProduct(id: string) {
    const product = await this.productsRepo.findById(id);
    if (!product) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }

  // GET /api/v1/admin/products?storeId=&status=&page=&limit=
  @Get()
  async list(
    @Query('storeId') storeId: string | undefined,
    @Query('status')  status:  string | undefined,
    @Query('page')    page:    string | undefined,
    @Query('limit')   limit:   string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    // Узкая валидация: разрешаем только реальные значения ProductStatus.
    const validStatus = status && (Object.values(ProductStatus) as string[]).includes(status)
      ? (status as ProductStatus)
      : undefined;
    return this.productsRepo.findAll({
      storeId,
      status: validStatus,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
  }

  // PATCH /api/v1/admin/products/:id/hide
  @Patch(':id/hide')
  @AdminPermission('product:moderate')
  async hide(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.requireAdmin(user);
    const product = await this.requireProduct(id);
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: 'PRODUCT_HIDDEN',
      entityType: 'Product',
      entityId: id,
      payload: { previousStatus: product.status },
    });
    return this.productsRepo.updateStatus(id, ProductStatus.HIDDEN_BY_ADMIN);
  }

  // PATCH /api/v1/admin/products/:id/restore
  @Patch(':id/restore')
  @AdminPermission('product:moderate')
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.requireAdmin(user);
    const product = await this.requireProduct(id);
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: 'PRODUCT_RESTORED',
      entityType: 'Product',
      entityId: id,
      payload: { previousStatus: product.status },
    });
    return this.productsRepo.updateStatus(id, ProductStatus.ACTIVE);
  }

  // DELETE /api/v1/admin/products/:id — принудительное удаление (soft delete, любой статус)
  @Delete(':id')
  @AdminPermission('product:delete')
  async forceDelete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.requireAdmin(user);
    const product = await this.requireProduct(id);
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: 'PRODUCT_FORCE_DELETED',
      entityType: 'Product',
      entityId: id,
      payload: { previousStatus: product.status, title: product.title },
    });
    await this.productsRepo.delete(id);
    return { success: true };
  }

  // PATCH /api/v1/admin/products/:id/archive
  @Patch(':id/archive')
  @AdminPermission('product:moderate')
  async archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.requireAdmin(user);
    const product = await this.requireProduct(id);
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: 'PRODUCT_ARCHIVED',
      entityType: 'Product',
      entityId: id,
      payload: { previousStatus: product.status },
    });
    return this.productsRepo.updateStatus(id, ProductStatus.ARCHIVED);
  }
}
