import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpStatus,
  Logger, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipMfaCheck } from '../../common/decorators/skip-mfa.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { PrismaService } from '../../database/prisma.service';

import { AdminAuthUseCase } from './use-cases/admin-auth.use-case';
import { AdminUsersManagementUseCase } from './use-cases/admin-users-management.use-case';
import { RefundOrderUseCase } from './use-cases/refund-order.use-case';
import { VerifySellerExtendedUseCase } from './use-cases/verify-seller-extended.use-case';
import { ActivateSellerOnMarketUseCase } from './use-cases/activate-seller-on-market.use-case';

/**
 * Super-admin endpoints — изолированы от AdminController чтобы избежать
 * мерж-конфликтов при параллельной работе.
 *
 * Все маршруты проверяют ADMIN role через RolesGuard. Дополнительная RBAC-проверка
 * (super_admin / moderator / etc) делается внутри use-cases по AdminUser.adminRole.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, MfaEnforcedGuard)
@Roles('ADMIN')
export class SuperAdminController {
  private readonly logger = new Logger(SuperAdminController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAuth: AdminAuthUseCase,
    private readonly adminUsersMgmt: AdminUsersManagementUseCase,
    private readonly refundOrder: RefundOrderUseCase,
    private readonly verifySellerExtended: VerifySellerExtendedUseCase,
    private readonly activateSellerOnMarket: ActivateSellerOnMarketUseCase,
  ) {}

  // ─── Auth / Profile ────────────────────────────────────────────────────────
  @Get('auth/me')
  @SkipMfaCheck()
  async getMe(@CurrentUser() user: JwtPayload) {
    // Возвращаем mfaPending в ответе чтобы фронт мог показать challenge UI.
    const me = await this.adminAuth.getMe(user.sub);
    return { ...me, mfaPending: !!user.mfaPending };
  }

  // ─── MFA (TOTP) ────────────────────────────────────────────────────────────
  @Post('auth/mfa/setup')
  @SkipMfaCheck()
  async setupMfa(@CurrentUser() user: JwtPayload) {
    const u = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { phone: true } });
    if (!u?.phone) throw new BadRequestException('User phone not found');
    return this.adminAuth.setupMfa(user.sub, u.phone);
  }

  @Post('auth/mfa/verify')
  @SkipMfaCheck()
  async verifyMfa(@CurrentUser() user: JwtPayload, @Body('code') code: string) {
    if (!code) throw new BadRequestException('code is required');
    return this.adminAuth.verifyMfa(user.sub, code);
  }

  @Post('auth/mfa/disable')
  @SkipMfaCheck()
  async disableMfa(@CurrentUser() user: JwtPayload, @Body('code') code: string) {
    if (!code) throw new BadRequestException('code is required');
    return this.adminAuth.disableMfa(user.sub, code);
  }

  // ─── POST /admin/auth/mfa/login ─────────────────────────────────────────
  // API-MFA-NOT-ENFORCED-001: challenge endpoint для login flow.
  // После telegram/otp-login admin с mfaEnabled=true получил token с mfaPending,
  // здесь обменивает его на полноценный token (с тем же sessionId).
  @Post('auth/mfa/login')
  @SkipMfaCheck()
  async mfaLogin(@CurrentUser() user: JwtPayload, @Body('code') code: string) {
    if (!code) throw new BadRequestException('code is required');
    if (!user.mfaPending) {
      throw new BadRequestException('MFA challenge not required for this token');
    }
    return this.adminAuth.mfaChallenge(user.sub, code, user.sessionId, user.role);
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

  // ─── Расширенная верификация продавца (с notes + checkedRequirements) ─────
  @Patch('sellers/:id/verify-extended')
  async verifySellerExtendedHandler(
    @CurrentUser() user: JwtPayload,
    @Param('id') sellerId: string,
    @Body() body: {
      status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
      reason?: string;
      notes?: string;
      checkedRequirements?: string[];
    },
  ) {
    if (!body.status) throw new BadRequestException('status is required');
    return this.verifySellerExtended.execute({
      adminUserId: user.sub,
      sellerId,
      status: body.status,
      reason: body.reason,
      notes: body.notes,
      checkedRequirements: body.checkedRequirements,
    });
  }

  // ─── Manual seller activation (без онлайн-оплаты) ─────────────────────────
  // POST /api/v1/admin/users/:id/activate-seller-on-market
  // Решение Полата 06.05.2026: монетизация заморожена. Продавец пишет в бот →
  // админ открывает доступ к рынку одним вызовом. См. activate-seller-on-market.use-case.
  @Post('users/:id/activate-seller-on-market')
  async activateSellerOnMarketHandler(
    @CurrentUser() user: JwtPayload,
    @Param('id') targetUserId: string,
    @Body() body: {
      fullName: string;
      sellerType: 'individual' | 'business';
      telegramUsername: string;
      storeName: string;
      storeCity: string;
      telegramContactLink: string;
      description?: string;
      region?: string;
      slug?: string;
    },
  ) {
    if (!body?.fullName?.trim()) throw new BadRequestException('fullName is required');
    if (!body?.sellerType) throw new BadRequestException('sellerType is required');
    if (!body?.telegramUsername?.trim()) throw new BadRequestException('telegramUsername is required');
    if (!body?.storeName?.trim()) throw new BadRequestException('storeName is required');
    if (!body?.storeCity?.trim()) throw new BadRequestException('storeCity is required');
    if (!body?.telegramContactLink?.trim()) throw new BadRequestException('telegramContactLink is required');
    if (body.sellerType !== 'individual' && body.sellerType !== 'business') {
      throw new BadRequestException('sellerType must be "individual" or "business"');
    }

    return this.activateSellerOnMarket.execute({
      actorUserId: user.sub,
      targetUserId,
      fullName: body.fullName.trim(),
      sellerType: body.sellerType,
      telegramUsername: body.telegramUsername.trim(),
      storeName: body.storeName.trim(),
      storeCity: body.storeCity.trim(),
      telegramContactLink: body.telegramContactLink.trim(),
      description: body.description?.trim(),
      region: body.region?.trim(),
      slug: body.slug?.trim(),
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
