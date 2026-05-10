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
import { DbManagerUseCase } from './use-cases/db-manager.use-case';

/**
 * AdminDbController — выделено из монолитного AdminController (P1 split,
 * см. analiz/logs.md AUDIT-POLAT-ZONE-2026-05-09).
 *
 * Subdomain: admin "DB Manager" UI (Supabase-style table browser).
 * Все mutate-эндпоинты пишут audit_log с action=db.<op>.<table>.
 *
 * Все routes сохраняют префикс /admin/db/tables — public contract не меняется.
 */
@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin/db')
@UseGuards(JwtAuthGuard, RolesGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminDbController {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly dbManagerUseCase: DbManagerUseCase,
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

  // GET /api/v1/admin/db/tables
  @Get('tables')
  async listTables(@CurrentUser() user: JwtPayload) {
    await this.requireAdmin(user);
    return this.dbManagerUseCase.listTables();
  }

  // GET /api/v1/admin/db/tables/:table/:id
  @Get('tables/:table/:id')
  async getRow(
    @Param('table') table: string,
    @Param('id')    id:    string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    return this.dbManagerUseCase.getRow(table, id);
  }

  // GET /api/v1/admin/db/tables/:table?page=&limit=&search=
  @Get('tables/:table')
  async getRows(
    @Param('table') table: string,
    @Query('page')   page:   string | undefined,
    @Query('limit')  limit:  string | undefined,
    @Query('search') search: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    return this.dbManagerUseCase.getRows(table, {
      page:  page  ? Number(page)  : 1,
      limit: limit ? Math.min(Number(limit), 100) : 25,
      search: search?.trim() || undefined,
    });
  }

  // PATCH /api/v1/admin/db/tables/:table/:id
  @Patch('tables/:table/:id')
  @AdminPermission('db:update')
  async updateRow(
    @Param('table') table: string,
    @Param('id')    id:    string,
    @Body()         data:  Record<string, unknown>,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: `db.update.${table}`,
      entityType: table,
      entityId: id,
      payload: { fields: Object.keys(data) },
    });
    return this.dbManagerUseCase.updateRow(table, id, data);
  }

  // DELETE /api/v1/admin/db/tables/:table/:id
  @Delete('tables/:table/:id')
  @AdminPermission('db:delete')
  async deleteRow(
    @Param('table') table: string,
    @Param('id')    id:    string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: `db.delete.${table}`,
      entityType: table,
      entityId: id,
      payload: {},
    });
    return this.dbManagerUseCase.deleteRow(table, id);
  }

  // POST /api/v1/admin/db/tables/:table
  @Post('tables/:table')
  @AdminPermission('db:insert')
  async insertRow(
    @Param('table') table: string,
    @Body()         data:  Record<string, unknown>,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    const result = await this.dbManagerUseCase.insertRow(table, data);
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: `db.insert.${table}`,
      entityType: table,
      entityId: (result as Record<string, unknown>).id as string ?? 'unknown',
      payload: { fields: Object.keys(data) },
    });
    return result;
  }
}
