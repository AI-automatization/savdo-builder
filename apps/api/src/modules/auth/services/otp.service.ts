import { randomInt, randomUUID } from 'crypto';
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
import {
  OTP_JOB_SEND_TELEGRAM,
  OTP_CODE_REF_KEY,
  OTP_CODE_REF_TTL_SECONDS,
  type OtpSendTelegramJobData,
} from '../../../queues/otp.jobs';

const OTP_VERIFY_ATTEMPTS_KEY = (phone: string) => `otp:attempts:${phone}`;
const OTP_MAX_ATTEMPTS = 5;
const OTP_BLOCK_TTL_SECONDS = 15 * 60; // 15 minutes

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    @InjectQueue(QUEUE_OTP) private readonly otpQueue: Queue,
  ) {}

  // SEC-001: crypto.randomInt — cryptographically secure 6-digit code
  // SEC-004: 6 digits (100000–999999) instead of 4
  generateCode(): string {
    return String(randomInt(100000, 1000000));
  }

  async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  async verifyCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  // SEC-002: Brute-force protection — track failed attempts per phone
  // Redis errors degrade gracefully: if Redis is unavailable, protection is skipped (no crash).
  async checkVerifyAttempts(phone: string): Promise<void> {
    try {
      const key = OTP_VERIFY_ATTEMPTS_KEY(phone);
      const attempts = await this.redis.get(key);
      if (attempts && Number(attempts) >= OTP_MAX_ATTEMPTS) {
        throw new DomainException(
          ErrorCode.OTP_SEND_LIMIT,
          'Слишком много неверных попыток. Подождите 15 минут.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (err) {
      if (err instanceof DomainException) throw err;
      this.logger.warn('Redis unavailable — skipping brute-force check');
    }
  }

  async recordFailedAttempt(phone: string): Promise<void> {
    try {
      const key = OTP_VERIFY_ATTEMPTS_KEY(phone);
      const current = await this.redis.get(key);
      const next = current ? Number(current) + 1 : 1;
      await this.redis.set(key, String(next), OTP_BLOCK_TTL_SECONDS);
    } catch {
      this.logger.warn('Redis unavailable — failed attempt not recorded');
    }
  }

  async clearVerifyAttempts(phone: string): Promise<void> {
    try {
      await this.redis.del(OTP_VERIFY_ATTEMPTS_KEY(phone));
    } catch {
      this.logger.warn('Redis unavailable — attempts counter not cleared');
    }
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const devMode = this.config.get<boolean>('features.devOtpEnabled');

    if (devMode) {
      // SEC-003: never log the actual code — only confirm delivery attempt
      this.logger.warn(`[DEV OTP] Sending code to phone=${phone}`);
      const chatId = await this.redis.get(TELEGRAM_CHAT_ID_KEY(phone));
      if (chatId) {
        const codeRef = await this.stashCodeInRedis(code);
        const jobData: OtpSendTelegramJobData = { chatId, phone, codeRef };
        await this.otpQueue.add(OTP_JOB_SEND_TELEGRAM, jobData, { priority: 1 });
      }
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

    const codeRef = await this.stashCodeInRedis(code);
    const jobData: OtpSendTelegramJobData = { chatId, phone, codeRef };
    await this.otpQueue.add(OTP_JOB_SEND_TELEGRAM, jobData, { priority: 1 });
    this.logger.log(`OTP queued for phone=${phone}`);
  }

  /**
   * API-BULL-BOARD-DATA-LEAK-001: вместо передачи code в job.data
   * (где Bull Board UI его палит) — кладём в Redis по короткоживущему ref.
   * Processor резолвит и удаляет ref после отправки.
   */
  private async stashCodeInRedis(code: string): Promise<string> {
    const codeRef = randomUUID();
    await this.redis.set(OTP_CODE_REF_KEY(codeRef), code, OTP_CODE_REF_TTL_SECONDS);
    return codeRef;
  }
}
