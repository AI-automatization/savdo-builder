import { Injectable, HttpStatus } from '@nestjs/common';
import { ModerationRepository } from '../repositories/moderation.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class GetCaseDetailUseCase {
  constructor(private readonly moderationRepo: ModerationRepository) {}

  async execute(caseId: string) {
    const moderationCase = await this.moderationRepo.findCaseById(caseId);

    if (!moderationCase) {
      throw new DomainException(
        ErrorCode.MODERATION_CASE_NOT_FOUND,
        'Moderation case not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return moderationCase;
  }
}
