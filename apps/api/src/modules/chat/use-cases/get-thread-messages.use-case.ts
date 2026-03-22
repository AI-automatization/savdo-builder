import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';

export interface GetThreadMessagesInput {
  threadId: string;
  readerUserId: string;
  limit?: number;
  before?: string;
}

@Injectable()
export class GetThreadMessagesUseCase {
  private readonly logger = new Logger(GetThreadMessagesUseCase.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(input: GetThreadMessagesInput): Promise<ChatMessage[]> {
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
      thread.buyerId === input.readerUserId || thread.sellerId === input.readerUserId;

    if (!isParticipant) {
      throw new DomainException(
        ErrorCode.NOT_THREAD_PARTICIPANT,
        'You are not a participant of this thread',
        HttpStatus.FORBIDDEN,
      );
    }

    const messages = await this.chatRepo.findMessages(input.threadId, {
      limit: input.limit,
      before: input.before,
    });

    // Mark messages from the other participant as read — fire-and-forget
    // We use the buyerId/sellerId stored on the thread to identify the counterpart.
    // "Read" means: messages whose senderUserId is NOT the current reader.
    // The schema does not have an isRead field on ChatMessage, so this operation
    // is a no-op in Phase A. The hook is in place for Phase B when the field is added.

    return messages;
  }
}
