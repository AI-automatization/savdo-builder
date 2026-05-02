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
  text: string;
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

    // TG notification → recipient (the other party)
    const preview = makePreview(input.text);
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
    };
  }
}
