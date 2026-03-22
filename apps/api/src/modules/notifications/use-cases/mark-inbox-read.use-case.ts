import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';

export interface MarkInboxReadInput {
  id: string;
  userId: string;
}

@Injectable()
export class MarkInboxReadUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(input: MarkInboxReadInput): Promise<void> {
    await this.notificationRepo.markInAppRead(input.id, input.userId);
  }
}
