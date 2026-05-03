import { Injectable, HttpStatus, Logger } from '@nestjs/common';
// otplib has CJS exports — import from the preset entry point
// (see: https://github.com/yeojz/otplib#installation)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const otplib = require('otplib') as { authenticator: { options: any; generateSecret: () => string; keyuri: (a: string, i: string, s: string) => string; verify: (o: { token: string; secret: string }) => boolean } };
const authenticator = otplib.authenticator;
import * as QRCode from 'qrcode';
import { PrismaService } from '../../../database/prisma.service';
import { TokenService } from '../../auth/services/token.service';
import { AuthRepository } from '../../auth/repositories/auth.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

// RFC 6238 TOTP: 6 цифр, 30 сек шаг — стандарт для Google Authenticator/Authy
authenticator.options = { digits: 6, step: 30, window: 1 };

const ADMIN_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'], // полный доступ
  admin:       ['user:*', 'store:*', 'product:*', 'order:*', 'moderation:*', 'broadcast:*', 'audit:read'],
  moderator:   ['moderation:*', 'store:moderate', 'product:moderate', 'audit:read'],
  support:    ['user:read', 'order:read', 'order:cancel', 'chat:read'],
  finance:    ['order:*', 'refund:*', 'analytics:read', 'audit:read'],
  read_only:  ['*:read'],
};

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
    const admin = await (this.prisma as any).adminUser.findUnique({
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

    const secret = authenticator.generateSecret(); // base32
    // Сохраняем pending secret пока не подтверждён через verify
    await (this.prisma as any).adminUser.update({
      where: { id: admin.id },
      data: { mfaSecret: secret },
    });

    const otpauthUrl = authenticator.keyuri(phone, this.issuer, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { errorCorrectionLevel: 'M', margin: 2 });

    return { secret, otpauthUrl, qrDataUrl };
  }

  // ── POST /admin/auth/mfa/verify ──────────────────────────────────────
  async verifyMfa(userId: string, code: string) {
    const admin = await this.requireAdmin(userId);
    if (!admin.mfaSecret) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'No MFA setup pending — call /setup first', HttpStatus.BAD_REQUEST);
    }
    const ok = authenticator.verify({ token: code, secret: admin.mfaSecret });
    if (!ok) {
      throw new DomainException(ErrorCode.OTP_INVALID, 'Invalid TOTP code', HttpStatus.BAD_REQUEST);
    }
    await (this.prisma as any).adminUser.update({
      where: { id: admin.id },
      data: { mfaEnabled: true, mfaEnabledAt: new Date() },
    });
    return { ok: true };
  }

  // ── POST /admin/auth/mfa/disable ─────────────────────────────────────
  async disableMfa(userId: string, code: string) {
    const admin = await this.requireAdmin(userId);
    if (!admin.mfaEnabled || !admin.mfaSecret) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'MFA not enabled', HttpStatus.BAD_REQUEST);
    }
    // Требуем валидный код для отключения (защита от atak'и через украденный JWT)
    const ok = authenticator.verify({ token: code, secret: admin.mfaSecret });
    if (!ok) {
      throw new DomainException(ErrorCode.OTP_INVALID, 'Invalid TOTP code', HttpStatus.BAD_REQUEST);
    }
    await (this.prisma as any).adminUser.update({
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
    if (!perms.includes('*') && !perms.includes('user:*') && !perms.includes('user:impersonate')) {
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
    const admin = await (this.prisma as any).adminUser.findUnique({ where: { userId } });
    if (!admin) {
      throw new DomainException(ErrorCode.ADMIN_NOT_FOUND, 'Admin record not found', HttpStatus.FORBIDDEN);
    }
    return admin;
  }
}
