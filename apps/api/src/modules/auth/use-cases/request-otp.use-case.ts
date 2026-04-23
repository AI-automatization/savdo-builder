import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../repositories/auth.repository';
import { OtpService } from '../services/otp.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const OTP_EXPIRY_MINUTES = 5;
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW_MINUTES = 10;

@Injectable()
export class RequestOtpUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly otpService: OtpService,
    private readonly config: ConfigService,
  ) {}

  async execute(phone: string, purpose: string): Promise<{ expiresAt: Date }> {
    // Rate limit: max 3 OTP requests per 10 minutes per phone per purpose
    const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MINUTES * 60 * 1000);
    const recentCount = await this.authRepo.countRecentOtpRequests(phone, windowStart, purpose);

    if (recentCount >= OTP_RATE_LIMIT) {
      throw new DomainException(
        ErrorCode.OTP_SEND_LIMIT,
        'Too many OTP requests. Please wait 10 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.otpService.generateCode();
    const codeHash = await this.otpService.hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.authRepo.createOtpRequest({ phone, codeHash, purpose, expiresAt });
    await this.otpService.sendOtp(phone, code);

    return { expiresAt };
  }
}
