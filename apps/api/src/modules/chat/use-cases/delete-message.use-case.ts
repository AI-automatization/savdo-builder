import { Injectable, HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';
import { ChatGateway } from '../../../socket/chat.gateway';

export interface DeleteMessageInput {
  threadId: string;
  messageId: string;
  /** Buyer profile id юзера (если есть). */
  buyerProfileId?: string;
  /** Seller profile id юзера (если есть). */
  sellerProfileId?: string;
}

/**
 * Soft-delete сообщения. Удалять может только автор.
 * Idempotent: уже удалённое сообщение → no-op.
 */
@Injectable()
export class DeleteMessageUseCase {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly chatGateway: ChatGateway,
  ) {}

  async execute(input: DeleteMessageInput): Promise<void> {
    const message = await this.chatRepo.findMessageById(input.messageId);

    if (!message || message.threadId !== input.threadId) {
      throw new DomainException(
        ErrorCode.THREAD_NOT_FOUND,
        'Message not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (message.isDeleted) return;

    // Author check: senderUserId — это Buyer.id или Seller.id.
    // Юзер автор если совпало с любым из его профилей.
    const isAuthor =
      (!!input.buyerProfileId && message.senderUserId === input.buyerProfileId) ||
      (!!input.sellerProfileId && message.senderUserId === input.sellerProfileId);

    if (!isAuthor) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Only the author can delete this message',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.chatRepo.softDeleteMessage(input.messageId);

    this.chatGateway.emitChatMessageDeleted(input.threadId, input.messageId);
  }
}
