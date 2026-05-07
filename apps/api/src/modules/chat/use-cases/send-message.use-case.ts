import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChatRepository } from '../repositories/chat.repository';
import { ChatGateway } from '../../../socket/chat.gateway';
import { SellerNotificationService } from '../../telegram/services/seller-notification.service';
import { MappedChatMessage } from './get-thread-messages.use-case';

const PREVIEW_MAX_LENGTH = 80;

function makePreview(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > PREVIEW_MAX_LENGTH
    ? trimmed.slice(0, PREVIEW_MAX_LENGTH) + '…'
    : trimmed;
}

export interface SendMessageInput {
  threadId: string;
  senderUserId: string;
  text?: string;
  parentMessageId?: string;
  mediaId?: string;
}

@Injectable()
export class SendMessageUseCase {
  private readonly logger = new Logger(SendMessageUseCase.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly config: ConfigService,
    private readonly chatGateway: ChatGateway,
    private readonly tgNotifier: SellerNotificationService,
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

    if (!input.text?.trim() && !input.mediaId) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Message must contain text or media',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate parentMessageId belongs to same thread (if provided)
    if (input.parentMessageId) {
      const parent = await this.chatRepo.findMessageById(input.parentMessageId);
      if (!parent || parent.threadId !== input.threadId) {
        throw new DomainException(
          ErrorCode.VALIDATION_ERROR,
          'Parent message not found in this thread',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const message = await this.chatRepo.addMessage({
      threadId: input.threadId,
      senderUserId: input.senderUserId,
      body: input.text?.trim() || null,
      parentMessageId: input.parentMessageId ?? null,
      mediaId: input.mediaId ?? null,
      messageType: input.mediaId ? 'image' : 'text',
    });

    this.logger.log(`Message sent to thread ${input.threadId} by user ${input.senderUserId}`);

    // Build mediaUrl + parentMessage preview for socket payload
    const mediaUrl = input.mediaId
      ? `${(process.env.APP_URL ?? '').replace(/\/$/, '')}/api/v1/media/proxy/${input.mediaId}`
      : null;

    let parentPreview: { id: string; text: string; senderRole: 'BUYER' | 'SELLER' } | null = null;
    if (input.parentMessageId) {
      const parent = await this.chatRepo.findMessageById(input.parentMessageId);
      if (parent) {
        parentPreview = {
          id: parent.id,
          text: parent.body ?? '',
          senderRole: parent.senderUserId === thread.buyerId ? 'BUYER' : 'SELLER',
        };
      }
    }

    const senderRole = message.senderUserId === thread.buyerId ? 'BUYER' : 'SELLER';
    this.chatGateway.emitChatMessage({ ...message, mediaUrl, parentMessage: parentPreview } as any, senderRole);

    // Notify seller-room when buyer sends a message
    const storeId = thread.seller.store?.id;
    const isBuyerSending = thread.buyerId !== null && thread.sellerId !== input.senderUserId;
    if (storeId && isBuyerSending) {
      this.chatGateway.emitChatNewMessage(storeId, { threadId: input.threadId });
    }

    // API-WS-PUSH-NOTIFICATIONS-001 (chat-unread): bump получателю чтобы
    // его chatUnread badge обновился без polling каждые 30 сек.
    // thread.buyer.userId / thread.seller.userId резолвят profile-id → User.id
    // (сами FK column'ы, не relation, доступны без extra include).
    const recipientUserId =
      senderRole === 'BUYER' ? thread.seller.userId : thread.buyer?.userId ?? null;
    if (recipientUserId) {
      this.chatGateway.emitChatUnreadBump(recipientUserId, input.threadId);
    }

    // TG notification → recipient (the other party)
    const preview = makePreview(input.text ?? (input.mediaId ? '📷 Фото' : ''));
    const productTitle = thread.product?.title ?? null;
    const orderNumber = thread.order?.orderNumber ?? null;
    const storeName = thread.seller.store?.name ?? null;

    if (senderRole === 'BUYER') {
      // → seller
      const sellerChatId = thread.seller.telegramChatId;
      const buyerName = thread.buyer?.user.phone ?? 'Покупатель';
      if (sellerChatId) {
        this.tgNotifier.notifyChatMessage({
          recipientChatId: String(sellerChatId),
          senderName: buyerName,
          productTitle,
          orderNumber,
          messagePreview: preview,
          threadId: input.threadId,
          recipientRole: 'SELLER',
        });
      }
    } else {
      // → buyer
      const buyerChatId = thread.buyer?.user.telegramId;
      if (buyerChatId) {
        this.tgNotifier.notifyChatMessage({
          recipientChatId: String(buyerChatId),
          senderName: storeName ?? 'Продавец',
          productTitle,
          orderNumber,
          storeName,
          messagePreview: preview,
          threadId: input.threadId,
          recipientRole: 'BUYER',
        });
      }
    }

    return {
      id: message.id,
      threadId: message.threadId,
      text: message.isDeleted ? '' : ((message as any).body ?? ''),
      senderRole,
      editedAt: (message as any).editedAt ? new Date((message as any).editedAt).toISOString() : null,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt.toISOString(),
      mediaUrl,
      parentMessage: parentPreview,
      messageType: (message as any).messageType ?? 'text',
    };
  }
}
