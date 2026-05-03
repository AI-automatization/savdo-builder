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
  editedAt: string | null;
  isDeleted: boolean;
  mediaUrl?: string | null;
  messageType?: string;
  parentMessage?: { id: string; text: string; senderRole: 'BUYER' | 'SELLER' } | null;
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

    // Mark thread as read (fire-and-forget — не блокирует ответ)
    const role = thread.buyerId === input.readerUserId ? 'buyer' : 'seller';
    void this.chatRepo.markAsRead(input.threadId, role).catch((err: unknown) => {
      this.logger.warn(`markAsRead failed: ${err instanceof Error ? err.message : String(err)}`);
    });

    const limit = input.limit ?? 50;
    const raw = await this.chatRepo.findMessages(input.threadId, {
      limit: limit + 1,
      before: input.before,
    });

    const hasMore = raw.length > limit;
    const slice = hasMore ? raw.slice(0, limit) : raw;

    const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');

    // Resolve parent message previews in batch (избежать N+1)
    const parentIds = Array.from(
      new Set(
        slice
          .map((m) => (m as any).parentMessageId as string | null)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const parents = parentIds.length
      ? await this.chatRepo.findMessagesByIds(parentIds)
      : [];
    const parentsById = new Map(parents.map((p) => [p.id, p]));

    const messages: MappedChatMessage[] = slice.map((m) => {
      const mAny = m as any;
      const parent = mAny.parentMessageId ? parentsById.get(mAny.parentMessageId) : null;
      return {
        id: m.id,
        threadId: m.threadId,
        text: m.isDeleted ? '' : (m.body ?? ''),
        senderRole: m.senderUserId === thread.buyerId ? 'BUYER' : 'SELLER',
        editedAt: mAny.editedAt ? new Date(mAny.editedAt).toISOString() : null,
        isDeleted: m.isDeleted,
        createdAt: m.createdAt.toISOString(),
        mediaUrl: mAny.mediaId ? `${appUrl}/api/v1/media/proxy/${mAny.mediaId}` : null,
        messageType: mAny.messageType ?? 'text',
        parentMessage: parent
          ? {
              id: parent.id,
              text: parent.isDeleted ? '' : ((parent as any).body ?? ''),
              senderRole: parent.senderUserId === thread.buyerId ? 'BUYER' : 'SELLER',
            }
          : null,
      };
    });

    return { messages, hasMore };
  }
}
