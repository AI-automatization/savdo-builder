import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcryptjs';
import { RedisService } from '../../../shared/redis.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { TELEGRAM_CHAT_ID_KEY } from '../../telegram/telegram-webhook.controller';
import { QUEUE_OTP } from '../../../queues/queues.module';
import { OTP_JOB_SEND_TELEGRAM, type OtpSendTelegramJobData } from '../../../queues/otp.jobs';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    @InjectQueue(QUEUE_OTP) private readonly otpQueue: Queue,
  ) {}

  generateCode(): string {
    // 4-digit code
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  async verifyCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const devMode = this.config.get<boolean>('features.devOtpEnabled');

    if (devMode) {
      this.logger.warn(`[DEV OTP] Phone: ${phone} | Code: ${code}`);
      return;
    }

    const chatId = await this.redis.get(TELEGRAM_CHAT_ID_KEY(phone));
    if (!chatId) {
      const botUsername = this.config.get<string>('telegram.botUsername') ?? 'savdo_builderBOT';
      throw new DomainException(
        ErrorCode.TELEGRAM_NOT_LINKED,
        `Telegram не привязан. Откройте @${botUsername} и поделитесь номером телефона, чтобы получать OTP коды.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Queue OTP delivery — worker retries on Telegram failure (up to 5 attempts)
    const jobData: OtpSendTelegramJobData = { chatId, phone, code };
    await this.otpQueue.add(OTP_JOB_SEND_TELEGRAM, jobData, {
      priority: 1, // highest priority
    });

    this.logger.log(`OTP queued for phone=${phone} chatId=${chatId}`);
  }
}
