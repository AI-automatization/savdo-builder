import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpStatus,
  Logger, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { PrismaService } from '../../database/prisma.service';

import { AdminAuthUseCase } from './use-cases/admin-auth.use-case';
import { AdminUsersManagementUseCase } from './use-cases/admin-users-management.use-case';
import { RefundOrderUseCase } from './use-cases/refund-order.use-case';

/**
 * Super-admin endpoints — изолированы от AdminController чтобы избежать
 * мерж-конфликтов при параллельной работе.
 *
 * Все маршруты проверяют ADMIN role через RolesGuard. Дополнительная RBAC-проверка
 * (super_admin / moderator / etc) делается внутри use-cases по AdminUser.adminRole.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SuperAdminController {
  private readonly logger = new Logger(SuperAdminController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAuth: AdminAuthUseCase,
    private readonly adminUsersMgmt: AdminUsersManagementUseCase,
    private readonly refundOrder: RefundOrderUseCase,
  ) {}

  // ─── Auth / Profile ────────────────────────────────────────────────────────
  @Get('auth/me')
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.adminAuth.getMe(user.sub);
  }

  // ─── MFA (TOTP) ────────────────────────────────────────────────────────────
  @Post('auth/mfa/setup')
  async setupMfa(@CurrentUser() user: JwtPayload) {
    const u = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { phone: true } });
    if (!u?.phone) throw new BadRequestException('User phone not found');
    return this.adminAuth.setupMfa(user.sub, u.phone);
  }

  @Post('auth/mfa/verify')
  async verifyMfa(@CurrentUser() user: JwtPayload, @Body('code') code: string) {
    if (!code) throw new BadRequestException('code is required');
    return this.adminAuth.verifyMfa(user.sub, code);
  }

  @Post('auth/mfa/disable')
  async disableMfa(@CurrentUser() user: JwtPayload, @Body('code') code: string) {
    if (!code) throw new BadRequestException('code is required');
    return this.adminAuth.disableMfa(user.sub, code);
  }

  // ─── Impersonation ─────────────────────────────────────────────────────────
  @Post('auth/impersonate/:userId')
  async impersonate(
    @CurrentUser() user: JwtPayload,
    @Param('userId') targetUserId: string,
  ) {
    return this.adminAuth.impersonate(user.sub, targetUserId);
  }

  // ─── Admin users CRUD (только super_admin) ─────────────────────────────────
  @Get('admins')
  async listAdmins() {
    return this.adminUsersMgmt.list();
  }

  @Post('admins')
  async createAdmin(
    @CurrentUser() user: JwtPayload,
    @Body() body: { phone: string; adminRole: string },
  ) {
    if (!body.phone || !body.adminRole) {
      throw new BadRequestException('phone and adminRole required');
    }
    const actor = await this.requireMyAdminRecord(user.sub);
    return this.adminUsersMgmt.create(actor.id, body.phone, body.adminRole);
  }

  @Patch('admins/:id/role')
  async changeAdminRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') targetId: string,
    @Body('adminRole') newRole: string,
  ) {
    if (!newRole) throw new BadRequestException('adminRole required');
    const actor = await this.requireMyAdminRecord(user.sub);
    return this.adminUsersMgmt.changeRole(actor.id, targetId, newRole);
  }

  @Delete('admins/:id')
  async revokeAdmin(
    @CurrentUser() user: JwtPayload,
    @Param('id') targetId: string,
  ) {
    const actor = await this.requireMyAdminRecord(user.sub);
    return this.adminUsersMgmt.revoke(actor.id, targetId);
  }

  // ─── Refund order ──────────────────────────────────────────────────────────
  @Post('orders/:id/refund')
  async refund(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
    @Body() body: { amount?: number; reason: string; notes?: string; returnedToWallet?: boolean },
  ) {
    if (!body.reason) throw new BadRequestException('reason is required');
    const actor = await this.requireMyAdminRecord(user.sub);
    return this.refundOrder.execute({
      adminId: actor.id,
      orderId,
      amount: body.amount,
      reason: body.reason,
      notes: body.notes,
      returnedToWallet: body.returnedToWallet,
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  private async requireMyAdminRecord(userId: string) {
    const admin = await (this.prisma as any).adminUser.findUnique({ where: { userId } });
    if (!admin) {
      throw new DomainException(ErrorCode.ADMIN_NOT_FOUND, 'Admin record not found', HttpStatus.FORBIDDEN);
    }
    return admin;
  }
}
