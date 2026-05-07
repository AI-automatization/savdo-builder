import { Injectable, HttpStatus } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { PrismaService } from '../../../database/prisma.service';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

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

    // API-MFA-NOT-ENFORCED-001: на refresh ВСЕГДА перепроверяем MFA. Это защищает
    // от сценария, когда злоумышленник украл refresh token — он не сможет
    // обойти MFA challenge при следующем refresh.
    const mfaPending = user.role === 'ADMIN'
      ? await this.authRepo.isAdminMfaEnabled(user.id)
      : false;

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      role: user.role,
      sessionId: session.id,
      ...(storeId && { storeId }),
      ...(mfaPending && { mfaPending: true }),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
