import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TelegramBotService } from '../modules/telegram/services/telegram-bot.service';
import { RedisService } from '../shared/redis.service';
import { QUEUE_OTP } from './queues.module';
import {
  OTP_JOB_SEND_TELEGRAM,
  OTP_CODE_REF_KEY,
  OtpSendTelegramJobData,
} from './otp.jobs';

export { OTP_JOB_SEND_TELEGRAM, OtpSendTelegramJobData };

@Processor(QUEUE_OTP)
export class OtpProcessor extends WorkerHost {
  private readonly logger = new Logger(OtpProcessor.name);

  constructor(
    private readonly telegramBot: TelegramBotService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== OTP_JOB_SEND_TELEGRAM) {
      this.logger.error(`OtpProcessor: unknown job "${job.name}"`);
      return;
    }

    const data = job.data as Partial<OtpSendTelegramJobData> & { code?: string };
    const { chatId, phone, codeRef } = data;

    if (!chatId || !phone) {
      this.logger.error('OtpProcessor: missing chatId or phone');
      return;
    }

    // Backward-compat: legacy job (до миграции BULL-BOARD-DATA-LEAK-001 имел
    // `code` прямо в data). Если стоит на очереди — обрабатываем тоже.
    const legacyCode = data.code;
    if (legacyCode && !codeRef) {
      this.logger.warn(`OtpProcessor: legacy job без codeRef — fallback`);
      return this.send(chatId, phone, legacyCode, job.attemptsMade);
    }

    if (!codeRef) {
      this.logger.error('OtpProcessor: missing codeRef');
      return;
    }

    // API-BULL-BOARD-DATA-LEAK-001: реальный code в Redis по ref.
    const code = await this.redis.get(OTP_CODE_REF_KEY(codeRef));
    if (!code) {
      // TTL истёк (10 мин) или processor запустился повторно после успешной
      // отправки (ref удалён). Не fatal — warn и skip.
      this.logger.warn(`OtpProcessor: codeRef expired/missing for phone=${phone} — skipping`);
      return;
    }

    await this.send(chatId, phone, code, job.attemptsMade);

    // Удаляем ref после отправки (idempotency защита от replay).
    await this.redis.del(OTP_CODE_REF_KEY(codeRef)).catch(() => undefined);
  }

  private async send(chatId: string, phone: string, code: string, attemptsMade: number): Promise<void> {
    this.logger.log(`Sending OTP to phone=${phone} chatId=${chatId} attempt=${attemptsMade + 1}`);

    await this.telegramBot.sendMessage(
      chatId,
      `🔐 <b>${code}</b> — ваш код для входа в Savdo.\n\nДействителен 5 минут. Никому не сообщайте.`,
      { parseMode: 'HTML' },
    );

    this.logger.log(`OTP sent OK to phone=${phone}`);
  }
}
