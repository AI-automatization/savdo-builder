import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationService } from '../modules/notifications/services/notification.service';
import { QUEUE_IN_APP_NOTIFICATIONS } from './queues.module';

export const IN_APP_JOB_CREATE = 'create';

export interface InAppNotificationJobData {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: object;
}

@Processor(QUEUE_IN_APP_NOTIFICATIONS)
export class InAppNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(InAppNotificationProcessor.name);

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<InAppNotificationJobData>): Promise<void> {
    try {
      const { userId, type, title, body, data } = job.data;
      await this.notificationService.createInAppDirect(userId, type, title, body, data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `InAppNotificationProcessor failed [job=${job.name} id=${job.id}]: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      // Rethrow so BullMQ counts the attempt and applies backoff/retry.
      throw err;
    }
  }
}
