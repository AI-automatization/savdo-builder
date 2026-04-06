import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';
import { ChatGateway } from '../../../socket/chat.gateway';

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

  async execute(input: SendMessageInput): Promise<ChatMessage> {
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

    if (thread.status === 'resolved') {
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

    this.chatGateway.emitChatMessage(message);

    // Notify seller-room when buyer sends a message
    const storeId = thread.seller.store?.id;
    const isBuyerSending = thread.buyerId !== null && thread.sellerId !== input.senderUserId;
    if (storeId && isBuyerSending) {
      this.chatGateway.emitChatNewMessage(storeId, { threadId: input.threadId });
    }

    return message;
  }
}
