import { Injectable, HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';

export interface MarkThreadReadInput {
  threadId: string;
  /** Buyer profile id юзера (если есть). */
  buyerProfileId?: string;
  /** Seller profile id юзера (если есть). */
  sellerProfileId?: string;
}

/**
 * Помечает тред прочитанным для участника (buyer или seller).
 * Dual-role: юзер участвует если совпал buyer- ИЛИ seller-профиль.
 */
@Injectable()
export class MarkThreadReadUseCase {
  constructor(private readonly chatRepo: ChatRepository) {}

  async execute(input: MarkThreadReadInput): Promise<void> {
    const thread = await this.chatRepo.findThreadParticipants(input.threadId);

    if (!thread) {
      throw new DomainException(
        ErrorCode.THREAD_NOT_FOUND,
        'Thread not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const isBuyer = !!input.buyerProfileId && thread.buyerId === input.buyerProfileId;
    const isSeller = !!input.sellerProfileId && thread.sellerId === input.sellerProfileId;

    if (!isBuyer && !isSeller) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Not a participant',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.chatRepo.markAsRead(input.threadId, isBuyer ? 'buyer' : 'seller');
  }
}
