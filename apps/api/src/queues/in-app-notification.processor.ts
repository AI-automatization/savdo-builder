import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { ChatGateway } from '../socket/chat.gateway';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {
    super();
  }

  async process(job: Job<InAppNotificationJobData>): Promise<void> {
    try {
      const { userId, type, title, body, data } = job.data;
      const created = await this.prisma.inAppNotification.create({
        data: { userId, type, title, body, data: data ?? {} },
      });
      // API-WS-PUSH-NOTIFICATIONS-001: real-time push на user-room.
      // Frontend больше не poll'ит каждые 30 сек — только слушает event.
      // Если client offline — не страшно: подключится → загрузит inbox через REST.
      this.chatGateway.emitNotificationNew(userId, {
        id: created.id,
        type: created.type,
        title: created.title,
        body: created.body,
        createdAt: created.createdAt.toISOString(),
        data: created.data,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `InAppNotificationProcessor failed [job=${job.name} id=${job.id}]: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
}
