import { Injectable } from '@nestjs/common';
import { NotificationLog } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';
import { ListNotificationLogsDto } from '../dto/list-notification-logs.dto';

export interface GetNotificationLogsResult {
  logs: NotificationLog[];
  total: number;
  page: number;
  limit: number;
}

export interface GetNotificationLogsInput {
  userId: string;
  query: ListNotificationLogsDto;
}

@Injectable()
export class GetNotificationLogsUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(input: GetNotificationLogsInput): Promise<GetNotificationLogsResult> {
    const page = input.query.page ?? 1;
    const limit = input.query.limit ?? 20;

    const { logs, total } = await this.notificationRepo.findByUserId(input.userId, {
      channel: input.query.channel,
      eventType: input.query.eventType,
      deliveryStatus: input.query.deliveryStatus,
      page,
      limit,
    });

    return { logs, total, page, limit };
  }
}
