import { Injectable, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { OtpService } from '../services/otp.service';
import { TokenService } from '../services/token.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

@Injectable()
export class VerifyOtpUseCase {
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
    const otpRequest = await this.authRepo.findActiveOtpRequest(phone, purpose);

    if (!otpRequest) {
      throw new DomainException(ErrorCode.OTP_NOT_FOUND, 'OTP not found or expired', HttpStatus.NOT_FOUND);
    }

    const isValid = await this.otpService.verifyCode(code, otpRequest.codeHash);
    if (!isValid) {
      throw new DomainException(ErrorCode.OTP_INVALID, 'Invalid OTP code', HttpStatus.BAD_REQUEST);
    }

    // Consume OTP (INV-I02: OTP cannot be reused)
    await this.authRepo.consumeOtpRequest(otpRequest.id);

    // Get or create user
    let user = await this.authRepo.findUserByPhone(phone);
    if (!user) {
      if (purpose === 'checkout') {
        user = (await this.authRepo.createUserWithBuyer({ phone })) as unknown as typeof user;
      } else {
        user = (await this.authRepo.createUserWithSeller({ phone })) as unknown as typeof user;
      }
    }
    // user is guaranteed non-null at this point (created above if missing)
    const resolvedUser = user!;

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

    const accessToken = this.tokenService.generateAccessToken({
      sub: resolvedUser.id,
      role: resolvedUser.role,
      sessionId: session.id,
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
