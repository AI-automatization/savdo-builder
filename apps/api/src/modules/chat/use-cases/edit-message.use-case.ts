import { Injectable, HttpStatus, BadRequestException } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';
import { ChatGateway } from '../../../socket/chat.gateway';

/** Окно редактирования сообщения — 15 минут после создания. */
const EDIT_WINDOW_MS = 15 * 60 * 1000;

export interface EditMessageInput {
  threadId: string;
  messageId: string;
  text: string;
  /** Buyer profile id юзера (если есть). */
  buyerProfileId?: string;
  /** Seller profile id юзера (если есть). */
  sellerProfileId?: string;
}

export interface EditMessageOutput {
  id: string;
  threadId: string;
  text: string;
  senderRole: 'BUYER' | 'SELLER';
  editedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
}

/**
 * Редактирование текста сообщения. Только автор, окно 15 минут.
 */
@Injectable()
export class EditMessageUseCase {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly chatGateway: ChatGateway,
  ) {}

  async execute(input: EditMessageInput): Promise<EditMessageOutput> {
    if (!input.text?.trim()) {
      throw new BadRequestException('text is required');
    }

    const message = await this.chatRepo.findMessageById(input.messageId);

    if (!message || message.threadId !== input.threadId) {
      throw new DomainException(
        ErrorCode.THREAD_NOT_FOUND,
        'Message not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (message.isDeleted) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Cannot edit a deleted message',
        HttpStatus.FORBIDDEN,
      );
    }

    const isAuthorAsBuyer =
      !!input.buyerProfileId && message.senderUserId === input.buyerProfileId;
    const isAuthorAsSeller =
      !!input.sellerProfileId && message.senderUserId === input.sellerProfileId;

    if (!isAuthorAsBuyer && !isAuthorAsSeller) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Only the author can edit this message',
        HttpStatus.FORBIDDEN,
      );
    }

    const ageMs = Date.now() - message.createdAt.getTime();
    if (ageMs > EDIT_WINDOW_MS) {
      throw new BadRequestException('Edit window expired (15 minutes)');
    }

    const updated = await this.chatRepo.updateMessageBody(
      input.messageId,
      input.text.trim(),
    );

    this.chatGateway.emitChatMessageEdited(updated);

    return {
      id: updated.id,
      threadId: updated.threadId,
      text: updated.body ?? '',
      senderRole: isAuthorAsSeller ? 'SELLER' : 'BUYER',
      editedAt: updated.editedAt ? updated.editedAt.toISOString() : null,
      isDeleted: false,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
