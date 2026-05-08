import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../../database/prisma.service';
import { TokenService } from '../../auth/services/token.service';
import { AuthRepository } from '../../auth/repositories/auth.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
} from '../../../common/constants/admin-permissions';

// RFC 6238 TOTP: 6 цифр, 30 сек шаг — стандарт для Google Authenticator/Authy.
// epochTolerance: 30s = ±1 шаг (эквивалент window:1 из otplib v12) для часовой
// дрифт пользователя (~30 сек в обе стороны). Apply on every verifySync call.
const TOTP_VERIFY_OPTIONS = {
  digits: 6,
  period: 30,
  epochTolerance: 30,
} as const;

@Injectable()
export class AdminAuthUseCase {
  private readonly logger = new Logger(AdminAuthUseCase.name);
  private readonly issuer = 'Savdo Admin';

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly authRepo: AuthRepository,
  ) {}

  // ── GET /admin/auth/me ───────────────────────────────────────────────
  async getMe(userId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { userId },
      include: { user: { select: { phone: true, telegramId: true, role: true } } },
    });
    if (!admin) {
      throw new DomainException(ErrorCode.ADMIN_NOT_FOUND, 'Admin record not found', HttpStatus.FORBIDDEN);
    }
    return {
      id: admin.id,
      userId: admin.userId,
      adminRole: admin.adminRole,
      isSuperadmin: admin.isSuperadmin,
      mfaEnabled: admin.mfaEnabled,
      lastLoginAt: admin.lastLoginAt,
      permissions: ADMIN_PERMISSIONS[admin.adminRole] ?? [],
      user: admin.user,
    };
  }

  // ── POST /admin/auth/mfa/setup ───────────────────────────────────────
  async setupMfa(userId: string, phone: string) {
    const admin = await this.requireAdmin(userId);
    if (admin.mfaEnabled) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'MFA already enabled — disable first to re-setup', HttpStatus.BAD_REQUEST);
    }

    const secret = generateSecret(); // base32, 20 bytes default
    // Сохраняем pending secret пока не подтверждён через verify
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { mfaSecret: secret },
    });

    const otpauthUrl = generateURI({ issuer: this.issuer, label: phone, secret });
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { errorCorrectionLevel: 'M', margin: 2 });

    return { secret, otpauthUrl, qrDataUrl };
  }

  // ── POST /admin/auth/mfa/verify ──────────────────────────────────────
  async verifyMfa(userId: string, code: string) {
    const admin = await this.requireAdmin(userId);
    if (!admin.mfaSecret) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'No MFA setup pending — call /setup first', HttpStatus.BAD_REQUEST);
    }
    const result = verifySync({ token: code, secret: admin.mfaSecret, ...TOTP_VERIFY_OPTIONS });
    if (!result.valid) {
      throw new DomainException(ErrorCode.OTP_INVALID, 'Invalid TOTP code', HttpStatus.BAD_REQUEST);
    }
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { mfaEnabled: true, mfaEnabledAt: new Date() },
    });
    return { ok: true };
  }

  // ── POST /admin/auth/mfa/login ───────────────────────────────────────
  // API-MFA-NOT-ENFORCED-001: challenge endpoint. Принимает TOTP-код и
  // возвращает новый access token БЕЗ mfaPending claim. SessionId сохраняется.
  async mfaChallenge(userId: string, code: string, sessionId: string, role: string) {
    const admin = await this.requireAdmin(userId);
    if (!admin.mfaEnabled || !admin.mfaSecret) {
      // Не должно случиться — guard пропустил без MFA. Но safety-check.
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'MFA not enabled', HttpStatus.BAD_REQUEST);
    }
    const result = verifySync({ token: code, secret: admin.mfaSecret, ...TOTP_VERIFY_OPTIONS });
    if (!result.valid) {
      throw new DomainException(ErrorCode.MFA_INVALID, 'Invalid TOTP code', HttpStatus.BAD_REQUEST);
    }

    // Re-issue access token — тот же sessionId, тот же role + adminRole,
    // но БЕЗ mfaPending.
    const accessToken = this.tokenService.generateAccessToken({
      sub: userId,
      role,
      sessionId,
      ...(admin.adminRole && { adminRole: admin.adminRole }),
    });

    // Update lastLoginAt — это эффективно «момент входа» для admin'а.
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`MFA challenge passed: admin=${admin.id} userId=${userId}`);

    return { accessToken };
  }

  // ── POST /admin/auth/mfa/disable ─────────────────────────────────────
  async disableMfa(userId: string, code: string) {
    const admin = await this.requireAdmin(userId);
    if (!admin.mfaEnabled || !admin.mfaSecret) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'MFA not enabled', HttpStatus.BAD_REQUEST);
    }
    // Требуем валидный код для отключения (защита от atak'и через украденный JWT)
    const result = verifySync({ token: code, secret: admin.mfaSecret, ...TOTP_VERIFY_OPTIONS });
    if (!result.valid) {
      throw new DomainException(ErrorCode.OTP_INVALID, 'Invalid TOTP code', HttpStatus.BAD_REQUEST);
    }
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { mfaEnabled: false, mfaSecret: null, mfaEnabledAt: null },
    });
    return { ok: true };
  }

  // ── POST /admin/auth/impersonate/:userId ─────────────────────────────
  async impersonate(adminUserId: string, targetUserId: string, ip?: string, ua?: string) {
    const admin = await this.requireAdmin(adminUserId);

    // Только super_admin или admin с user:impersonate
    const perms = ADMIN_PERMISSIONS[admin.adminRole] ?? [];
    if (!hasAdminPermission(perms, 'user:impersonate')) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Insufficient permissions for impersonation', HttpStatus.FORBIDDEN);
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, phone: true, role: true },
    });
    if (!target) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Target user not found', HttpStatus.NOT_FOUND);
    }

    // Запрет: имperсonate другого admin'а (защита от privilege escalation)
    if (target.role === 'ADMIN') {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Cannot impersonate another admin', HttpStatus.FORBIDDEN);
    }

    // Создаём короткоживущую сессию для имперсонации (1 час макс)
    const session = await this.authRepo.createSession({
      id: crypto.randomUUID(),
      userId: target.id,
      refreshTokenHash: 'impersonation-no-refresh',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      ipAddress: ip,
      userAgent: `[impersonated by ${admin.id}] ${ua ?? ''}`,
    });

    const accessToken = this.tokenService.generateAccessToken({
      sub: target.id,
      role: target.role,
      sessionId: session.id,
    });

    this.logger.warn(`IMPERSONATION: admin=${admin.id} userId=${adminUserId} → target=${target.id} phone=${target.phone}`);

    return {
      accessToken,
      target: { id: target.id, phone: target.phone, role: target.role },
      adminId: admin.id,
      expiresIn: 3600,
    };
  }

  private async requireAdmin(userId: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { userId } });
    if (!admin) {
      throw new DomainException(ErrorCode.ADMIN_NOT_FOUND, 'Admin record not found', HttpStatus.FORBIDDEN);
    }
    return admin;
  }
}
