import { Injectable } from '@nestjs/common';
import { ModerationRepository } from '../repositories/moderation.repository';

@Injectable()
export class GetModerationQueueUseCase {
  constructor(private readonly moderationRepo: ModerationRepository) {}

  async execute(options?: { page?: number; limit?: number }) {
    return this.moderationRepo.findPendingCases(options);
  }
}
