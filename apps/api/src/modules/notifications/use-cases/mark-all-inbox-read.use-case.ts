import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';

@Injectable()
export class MarkAllInboxReadUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(userId: string): Promise<void> {
    await this.notificationRepo.markAllInAppRead(userId);
  }
}
