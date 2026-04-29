import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';
import { ChatGateway } from '../../../socket/chat.gateway';
import { MappedChatMessage } from './get-thread-messages.use-case';

export interface SendMessageInput {
  threadId: string;
  senderUserId: string;
  text: string;
}

@Injectable()
export class SendMessageUseCase {
  private readonly logger = new Logger(SendMessageUseCase.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly config: ConfigService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async execute(input: SendMessageInput): Promise<MappedChatMessage> {
    const chatEnabled = this.config.get<boolean>('features.chatEnabled');

    if (!chatEnabled) {
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Chat is currently disabled',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const thread = await this.chatRepo.findThreadById(input.threadId);

    if (!thread) {
      throw new DomainException(
        ErrorCode.THREAD_NOT_FOUND,
        'Thread not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const isParticipant =
      thread.buyerId === input.senderUserId || thread.sellerId === input.senderUserId;

    if (!isParticipant) {
      throw new DomainException(
        ErrorCode.NOT_THREAD_PARTICIPANT,
        'You are not a participant of this thread',
        HttpStatus.FORBIDDEN,
      );
    }

    if (thread.status === 'CLOSED') {
      throw new DomainException(
        ErrorCode.THREAD_CLOSED,
        'Thread is resolved and no longer accepts messages',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const message = await this.chatRepo.addMessage({
      threadId: input.threadId,
      senderUserId: input.senderUserId,
      body: input.text,
    });

    this.logger.log(`Message sent to thread ${input.threadId} by user ${input.senderUserId}`);

    const senderRole = message.senderUserId === thread.buyerId ? 'BUYER' : 'SELLER';
    this.chatGateway.emitChatMessage(message, senderRole);

    // Notify seller-room when buyer sends a message
    const storeId = thread.seller.store?.id;
    const isBuyerSending = thread.buyerId !== null && thread.sellerId !== input.senderUserId;
    if (storeId && isBuyerSending) {
      this.chatGateway.emitChatNewMessage(storeId, { threadId: input.threadId });
    }

    return {
      id: message.id,
      threadId: message.threadId,
      text: message.isDeleted ? '' : ((message as any).body ?? ''),
      senderRole,
      editedAt: (message as any).editedAt ? new Date((message as any).editedAt).toISOString() : null,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
