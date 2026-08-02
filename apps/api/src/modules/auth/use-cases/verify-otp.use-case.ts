import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { OtpService } from '../services/otp.service';
import { TokenService } from '../services/token.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

@Injectable()
export class VerifyOtpUseCase {
  private readonly logger = new Logger(VerifyOtpUseCase.name);

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    phone: string,
    code: string,
    purpose: string,
    meta?: { deviceType?: string; deviceName?: string; ipAddress?: string; userAgent?: string },
  ) {
    // SEC-002: check brute-force block before any DB lookup
    await this.otpService.checkVerifyAttempts(phone);

    const otpRequest = await this.authRepo.findActiveOtpRequest(phone, purpose);

    if (!otpRequest) {
      await this.otpService.recordFailedAttempt(phone);
      throw new DomainException(ErrorCode.OTP_NOT_FOUND, 'OTP not found or expired', HttpStatus.NOT_FOUND);
    }

    const isValid = await this.otpService.verifyCode(code, otpRequest.codeHash);
    if (!isValid) {
      await this.otpService.recordFailedAttempt(phone);
      throw new DomainException(ErrorCode.OTP_INVALID, 'Invalid OTP code', HttpStatus.BAD_REQUEST);
    }

    // Consume OTP + clear failed attempts counter on success
    await this.authRepo.consumeOtpRequest(otpRequest.id);
    await this.otpService.clearVerifyAttempts(phone);

    // Get or create user — всегда создаём BUYER.
    // Seller создаётся отдельно через POST /seller/apply (onboarding flow).
    let user = await this.authRepo.findUserByPhone(phone);
    if (!user) {
      user = (await this.authRepo.createUserWithBuyer({ phone })) as unknown as typeof user;
    } else if (!user.buyer) {
      // Пользователь уже есть (SELLER или ghost), но buyer-профиля нет — создаём
      await this.authRepo.ensureBuyerProfile(user.id);
    }
    // user is guaranteed non-null at this point (created above if missing)
    const resolvedUser = user!;

    // API-USER-LOGIN-BLOCK-001 + API-AUTO-RESTORE-001: гард soft-deleted / BLOCKED.
    // Ранее этот use-case вообще НЕ проверял deletedAt/status — soft-deleted юзер
    // мог переслать OTP по своему телефону и обойти блок. Добавляем тот же flow,
    // что и в TelegramAuthUseCase. Порядок проверок: deletedAt FIRST, потом status.
    if (resolvedUser.deletedAt) {
      const outcome = await this.authRepo.restoreUserIfWithinGrace(resolvedUser.id);
      if (outcome.state === 'restored') {
        resolvedUser.deletedAt = null;
        resolvedUser.status = 'ACTIVE';
        this.logger.warn(
          `Account restored within grace period: user=${resolvedUser.id} previousDeletedAt=${outcome.previousDeletedAt.toISOString()}`,
        );
      } else if (outcome.state === 'expired') {
        this.logger.warn(
          `Login blocked (permanently deleted): user=${resolvedUser.id} deletedAt=${outcome.deletedAt.toISOString()}`,
        );
        throw new DomainException(
          ErrorCode.ACCOUNT_PERMANENTLY_DELETED,
          'Аккаунт удалён безвозвратно. Зарегистрируйтесь заново.',
          HttpStatus.FORBIDDEN,
        );
      }
      // state === 'not_deleted' — гонка, продолжаем.
    } else if (resolvedUser.status === 'BLOCKED') {
      // Admin-suspended (без deletedAt) — auto-restore НЕ применяется.
      this.logger.warn(
        `Login blocked (admin-suspended): user=${resolvedUser.id} status=${resolvedUser.status}`,
      );
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Account is suspended',
        HttpStatus.FORBIDDEN,
      );
    }

    // Generate sessionId upfront so we can build the token before the DB insert — one write
    const sessionId = randomUUID();
    const rawToken = this.tokenService.generateRefreshToken();
    const refreshToken = `${sessionId}.${rawToken}`;
    const refreshTokenHash = await this.tokenService.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const session = await this.authRepo.createSession({
      id: sessionId,
      userId: resolvedUser.id,
      refreshTokenHash,
      expiresAt,
      ...meta,
    });

    const storeId = resolvedUser.role === 'SELLER'
      ? await this.authRepo.findStoreIdByUserId(resolvedUser.id)
      : undefined;

    // API-RBAC-MICRO-PERMISSIONS-001: adminRole одним DB-вызовом.
    const adminClaims = resolvedUser.role === 'ADMIN'
      ? await this.authRepo.findAdminClaims(resolvedUser.id)
      : null;

    const accessToken = this.tokenService.generateAccessToken({
      sub: resolvedUser.id,
      role: resolvedUser.role,
      sessionId: session.id,
      ...(storeId && { storeId }),
      // SEC-ADMIN-ACCESS-MODEL стадия C: MFA обязателен для ВСЕХ админов.
      // Раньше mfaPending поднимался лишь при mfaEnabled=true → админ без
      // настроенного MFA входил по одному OTP (SEC-AUDIT-01). Теперь mfaPending
      // у любого админа: mfaEnabled=true → TOTP-challenge, mfaEnabled=false →
      // LoginPage форсит MFA-setup. Снимается через /admin/auth/mfa/login.
      ...(adminClaims && { mfaPending: true }),
      ...(adminClaims?.adminRole && { adminRole: adminClaims.adminRole }),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: resolvedUser.id,
        phone: resolvedUser.phone,
        role: resolvedUser.role,
      },
    };
  }
}
