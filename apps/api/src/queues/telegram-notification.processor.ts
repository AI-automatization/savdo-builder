import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TelegramBotService } from '../modules/telegram/services/telegram-bot.service';
import { PrismaService } from '../database/prisma.service';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from './queues.module';
import {
  NotifyNewOrderData,
  NotifyStoreApprovedData,
  NotifyStoreRejectedData,
  NotifyVerificationApprovedData,
} from '../modules/telegram/services/seller-notification.service';
import { TELEGRAM_JOB_BROADCAST } from '../modules/admin/use-cases/broadcast.use-case';

export const TELEGRAM_JOB_NEW_ORDER = 'new-order';
export const TELEGRAM_JOB_STORE_APPROVED = 'store-approved';
export const TELEGRAM_JOB_STORE_REJECTED = 'store-rejected';
export const TELEGRAM_JOB_VERIFICATION_APPROVED = 'verification-approved';

@Processor(QUEUE_TELEGRAM_NOTIFICATIONS)
export class TelegramNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramNotificationProcessor.name);

  constructor(
    private readonly telegramBot: TelegramBotService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    try {
      switch (job.name) {
        case TELEGRAM_JOB_NEW_ORDER: {
          const d = job.data as NotifyNewOrderData;
          const text =
            `📦 Новый заказ #${d.orderNumber}\n` +
            `Магазин: ${d.storeName}\n` +
            `Товаров: ${d.itemCount}\n` +
            `Сумма: ${d.total} ${d.currency}`;
          await this.telegramBot.sendMessage(`@${d.sellerTelegramUsername}`, text);
          break;
        }

        case TELEGRAM_JOB_STORE_APPROVED: {
          const d = job.data as NotifyStoreApprovedData;
          await this.telegramBot.sendMessage(
            `@${d.sellerTelegramUsername}`,
            `✅ Ваш магазин «${d.storeName}» одобрен и теперь доступен покупателям!`,
          );
          break;
        }

        case TELEGRAM_JOB_STORE_REJECTED: {
          const d = job.data as NotifyStoreRejectedData;
          const reasonLine = d.reason ? `\nПричина: ${d.reason}` : '';
          await this.telegramBot.sendMessage(
            `@${d.sellerTelegramUsername}`,
            `❌ Ваш магазин «${d.storeName}» отклонён.${reasonLine}`,
          );
          break;
        }

        case TELEGRAM_JOB_VERIFICATION_APPROVED: {
          const d = job.data as NotifyVerificationApprovedData;
          await this.telegramBot.sendMessage(
            `@${d.sellerTelegramUsername}`,
            '✅ Ваш аккаунт продавца верифицирован. Теперь вы можете создать магазин.',
          );
          break;
        }

        case TELEGRAM_JOB_BROADCAST: {
          const d = job.data as { chatId: string; message: string; broadcastLogId: string };
          try {
            await this.telegramBot.sendMessage(d.chatId, d.message, { parseMode: 'HTML' });
            await this.prisma.broadcastLog.update({
              where: { id: d.broadcastLogId },
              data: { sentCount: { increment: 1 } },
            });
          } catch {
            await this.prisma.broadcastLog.update({
              where: { id: d.broadcastLogId },
              data: { failedCount: { increment: 1 } },
            });
          }
          break;
        }

        default:
          this.logger.error(
            `TelegramNotificationProcessor: unknown job name "${job.name}" (id=${job.id})`,
          );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `TelegramNotificationProcessor failed [job=${job.name} id=${job.id}]: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
}
