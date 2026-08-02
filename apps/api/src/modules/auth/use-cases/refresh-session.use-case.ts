import { Injectable, HttpStatus } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { PrismaService } from '../../../database/prisma.service';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// API-ADMIN-MFA-PERSIST-001: после успешного MFA challenge admin может работать
// без повторного challenge в течение этого окна. Без этого refresh-session (см.
// ниже) ронял admin в MFA loop при каждом access TTL expire (15 мин).
// 8 часов — стандартный admin рабочий день; настраивается через env при
// необходимости (override через MFA_GRACE_HOURS).
const MFA_GRACE_HOURS = Number(process.env.MFA_GRACE_HOURS ?? '8');

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(refreshToken: string) {
    // Refresh token format: `${sessionId}.${randomBytes}`
    // Split on first dot only to extract sessionId
    const dotIndex = refreshToken.indexOf('.');
    if (dotIndex === -1) {
      throw new DomainException(ErrorCode.REFRESH_TOKEN_INVALID, 'Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    const sessionId = refreshToken.substring(0, dotIndex);
    if (!sessionId) {
      throw new DomainException(ErrorCode.REFRESH_TOKEN_INVALID, 'Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    const session = await this.authRepo.findSessionById(sessionId);
    if (!session || session.expiresAt < new Date()) {
      throw new DomainException(ErrorCode.REFRESH_TOKEN_INVALID, 'Session expired or not found', HttpStatus.UNAUTHORIZED);
    }

    const isValid = await this.tokenService.verifyRefreshToken(refreshToken, session.refreshTokenHash);
    if (!isValid) {
      throw new DomainException(ErrorCode.REFRESH_TOKEN_INVALID, 'Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.status === 'BLOCKED') {
      throw new DomainException(ErrorCode.UNAUTHORIZED, 'User not found or blocked', HttpStatus.UNAUTHORIZED);
    }

    // Rotate refresh token
    const newRawToken = this.tokenService.generateRefreshToken();
    const newRefreshToken = `${session.id}.${newRawToken}`;
    const newHash = await this.tokenService.hashRefreshToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: newHash, expiresAt: newExpiresAt, lastSeenAt: new Date() },
    });

    const storeId = user.role === 'SELLER'
      ? await this.authRepo.findStoreIdByUserId(user.id)
      : undefined;

    // API-MFA-NOT-ENFORCED-001 + API-RBAC-MICRO-PERMISSIONS-001:
    // На refresh перепроверяем MFA + adminRole. Защищает от украденного
    // refresh token (если session не mfa-verified — MFA challenge обязателен)
    // и от случая когда у admin'а изменили роль/отозвали admin.
    const adminClaims = user.role === 'ADMIN'
      ? await this.authRepo.findAdminClaims(user.id)
      : null;

    // API-ADMIN-MFA-PERSIST-001: если admin **уже прошёл** MFA challenge в
    // рамках этой сессии и mfaVerifiedAt не старее MFA_GRACE_HOURS — выдаём
    // чистый токен без mfaPending. Иначе refresh ронял admin в MFA loop
    // при каждом access TTL expire — каждое destructive action ломалось.
    const mfaGraceMs = MFA_GRACE_HOURS * 60 * 60 * 1000;
    const mfaStillValid =
      session.mfaVerifiedAt !== null &&
      session.mfaVerifiedAt !== undefined &&
      Date.now() - session.mfaVerifiedAt.getTime() < mfaGraceMs;
    const needsMfa = adminClaims && !mfaStillValid;

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      role: user.role,
      sessionId: session.id,
      ...(storeId && { storeId }),
      // SEC-ADMIN-ACCESS-MODEL стадия C: mfaPending только если сессия НЕ была
      // mfa-verified или истёк grace period. После повторного MFA challenge
      // mfaVerifiedAt обновится (см. admin-auth.use-case.mfaChallenge).
      ...(needsMfa && { mfaPending: true }),
      ...(adminClaims?.adminRole && { adminRole: adminClaims.adminRole }),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
