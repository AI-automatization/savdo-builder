import { Injectable } from '@nestjs/common';
import { InAppNotification } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';
import { ListInboxDto } from '../dto/list-inbox.dto';

export interface GetInboxResult {
  notifications: InAppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface GetInboxInput {
  userId: string;
  query: ListInboxDto;
}

@Injectable()
export class GetInboxUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(input: GetInboxInput): Promise<GetInboxResult> {
    const page = input.query.page ?? 1;
    const limit = input.query.limit ?? 20;

    const { notifications, total, unreadCount } = await this.notificationRepo.findInAppByUserId(
      input.userId,
      {
        unreadOnly: input.query.unreadOnly,
        page,
        limit,
      },
    );

    return { notifications, total, unreadCount, page, limit };
  }
}
