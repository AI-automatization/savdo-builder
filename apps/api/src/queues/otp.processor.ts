import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TelegramBotService } from '../modules/telegram/services/telegram-bot.service';
import { QUEUE_OTP } from './queues.module';
import { OTP_JOB_SEND_TELEGRAM, OtpSendTelegramJobData } from './otp.jobs';

export { OTP_JOB_SEND_TELEGRAM, OtpSendTelegramJobData };

@Processor(QUEUE_OTP)
export class OtpProcessor extends WorkerHost {
  private readonly logger = new Logger(OtpProcessor.name);

  constructor(private readonly telegramBot: TelegramBotService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== OTP_JOB_SEND_TELEGRAM) {
      this.logger.error(`OtpProcessor: unknown job "${job.name}"`);
      return;
    }

    const { chatId, phone, code } = job.data as OtpSendTelegramJobData;

    this.logger.log(`Sending OTP to phone=${phone} chatId=${chatId} attempt=${job.attemptsMade + 1}`);

    await this.telegramBot.sendMessage(
      chatId,
      `🔐 <b>${code}</b> — ваш код для входа в Savdo.\n\nДействителен 5 минут. Никому не сообщайте.`,
      { parseMode: 'HTML' },
    );

    this.logger.log(`OTP sent OK to phone=${phone}`);
  }
}
