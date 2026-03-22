import { Injectable, Logger } from '@nestjs/common';
import { ModerationRepository } from '../repositories/moderation.repository';
import { ModerationCase } from '@prisma/client';

@Injectable()
export class ModerationTriggerService {
  private readonly logger = new Logger(ModerationTriggerService.name);

  constructor(private readonly moderationRepo: ModerationRepository) {}

  /**
   * Opens a moderation case for a store submission.
   * Idempotent — if an open case already exists for this store, returns it.
   */
  async openCaseForStore(storeId: string): Promise<ModerationCase> {
    const existing = await this.moderationRepo.findCaseByEntity('store', storeId);

    if (existing && existing.status === 'open') {
      this.logger.log(`Returning existing moderation case ${existing.id} for store ${storeId}`);
      return existing;
    }

    const newCase = await this.moderationRepo.createCase({
      entityType: 'store',
      entityId: storeId,
      caseType: 'verification',
    });

    this.logger.log(`Created moderation case ${newCase.id} for store ${storeId}`);
    return newCase;
  }

  /**
   * Opens a moderation case for seller verification.
   * Idempotent — if an open case already exists for this seller, returns it.
   */
  async openCaseForSeller(sellerId: string): Promise<ModerationCase> {
    const existing = await this.moderationRepo.findCaseByEntity('seller', sellerId);

    if (existing && existing.status === 'open') {
      this.logger.log(`Returning existing moderation case ${existing.id} for seller ${sellerId}`);
      return existing;
    }

    const newCase = await this.moderationRepo.createCase({
      entityType: 'seller',
      entityId: sellerId,
      caseType: 'verification',
    });

    this.logger.log(`Created moderation case ${newCase.id} for seller ${sellerId}`);
    return newCase;
  }
}
