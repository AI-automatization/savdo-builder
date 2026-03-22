import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SellerNotificationService } from '../modules/telegram/services/seller-notification.service';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from './queues.module';

export const TELEGRAM_JOB_NEW_ORDER = 'new-order';
export const TELEGRAM_JOB_STORE_APPROVED = 'store-approved';
export const TELEGRAM_JOB_STORE_REJECTED = 'store-rejected';
export const TELEGRAM_JOB_VERIFICATION_APPROVED = 'verification-approved';

@Processor(QUEUE_TELEGRAM_NOTIFICATIONS)
export class TelegramNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramNotificationProcessor.name);

  constructor(private readonly sellerNotificationService: SellerNotificationService) {
    super();
  }

  async process(job: Job): Promise<void> {
    try {
      switch (job.name) {
        case TELEGRAM_JOB_NEW_ORDER:
          await this.sellerNotificationService.sendNewOrder(job.data);
          break;

        case TELEGRAM_JOB_STORE_APPROVED:
          await this.sellerNotificationService.sendStoreApproved(job.data);
          break;

        case TELEGRAM_JOB_STORE_REJECTED:
          await this.sellerNotificationService.sendStoreRejected(job.data);
          break;

        case TELEGRAM_JOB_VERIFICATION_APPROVED:
          await this.sellerNotificationService.sendVerificationApproved(job.data);
          break;

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
      // Rethrow so BullMQ counts the attempt and applies backoff/retry.
      throw err;
    }
  }
}
