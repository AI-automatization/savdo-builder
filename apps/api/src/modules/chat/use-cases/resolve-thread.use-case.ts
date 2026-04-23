import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatThread } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';

export interface ResolveThreadInput {
  threadId: string;
  sellerUserId: string;
}

@Injectable()
export class ResolveThreadUseCase {
  private readonly logger = new Logger(ResolveThreadUseCase.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(input: ResolveThreadInput): Promise<ChatThread> {
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

    // Only the seller of the thread may resolve it.
    // We compare by sellerId (the Seller.id UUID stored on the thread).
    if (thread.sellerId !== input.sellerUserId) {
      throw new DomainException(
        ErrorCode.NOT_THREAD_PARTICIPANT,
        'Only the thread seller can resolve this thread',
        HttpStatus.FORBIDDEN,
      );
    }

    if (thread.status === 'CLOSED') {
      // Already resolved — idempotent return
      return thread;
    }

    const resolved = await this.chatRepo.resolveThread(input.threadId);

    this.logger.log(`Thread ${input.threadId} resolved by seller ${input.sellerUserId}`);

    return resolved;
  }
}
