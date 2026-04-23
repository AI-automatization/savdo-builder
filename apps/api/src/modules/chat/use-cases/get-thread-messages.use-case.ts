import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';

export interface GetThreadMessagesInput {
  threadId: string;
  readerUserId: string;
  limit?: number;
  before?: string;
}

export interface MappedChatMessage {
  id: string;
  threadId: string;
  text: string;
  senderRole: 'BUYER' | 'SELLER';
  createdAt: string;
}

export interface GetThreadMessagesOutput {
  messages: MappedChatMessage[];
  hasMore: boolean;
}

@Injectable()
export class GetThreadMessagesUseCase {
  private readonly logger = new Logger(GetThreadMessagesUseCase.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(input: GetThreadMessagesInput): Promise<GetThreadMessagesOutput> {
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

    const limit = input.limit ?? 50;
    const raw = await this.chatRepo.findMessages(input.threadId, {
      limit: limit + 1,
      before: input.before,
    });

    const hasMore = raw.length > limit;
    const slice = hasMore ? raw.slice(0, limit) : raw;

    const messages: MappedChatMessage[] = slice.map((m) => ({
      id: m.id,
      threadId: m.threadId,
      text: m.body ?? '',
      senderRole: m.senderUserId === thread.buyerId ? 'BUYER' : 'SELLER',
      createdAt: m.createdAt.toISOString(),
    }));

    return { messages, hasMore };
  }
}
