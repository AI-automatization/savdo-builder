import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';

export interface DeleteInboxNotificationInput {
  id: string;
  userId: string;
}

@Injectable()
export class DeleteInboxNotificationUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(input: DeleteInboxNotificationInput): Promise<void> {
    await this.notificationRepo.deleteInApp(input.id, input.userId);
  }
}
