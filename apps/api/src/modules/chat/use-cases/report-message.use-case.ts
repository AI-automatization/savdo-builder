import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';

export interface ReportMessageInput {
  messageId: string;
  /** User id (для логирования). */
  reporterUserId: string;
  /** Buyer profile id юзера (если есть). */
  buyerProfileId?: string;
  /** Seller profile id юзера (если есть). */
  sellerProfileId?: string;
}

/**
 * Жалоба на сообщение. Жаловаться может только участник треда.
 */
@Injectable()
export class ReportMessageUseCase {
  private readonly logger = new Logger(ReportMessageUseCase.name);

  constructor(private readonly chatRepo: ChatRepository) {}

  async execute(input: ReportMessageInput): Promise<void> {
    const message = await this.chatRepo.findMessageWithThreadParticipants(
      input.messageId,
    );

    if (!message) {
      throw new DomainException(
        ErrorCode.THREAD_NOT_FOUND,
        'Message not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const { buyerId, sellerId } = message.thread;
    const isParticipant =
      (!!input.buyerProfileId && input.buyerProfileId === buyerId) ||
      (!!input.sellerProfileId && input.sellerProfileId === sellerId);

    if (!isParticipant) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Not a participant',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.chatRepo.setMessageReportedAt(input.messageId, new Date());

    this.logger.warn(
      `Message ${input.messageId} reported by user ${input.reporterUserId}`,
    );
  }
}
