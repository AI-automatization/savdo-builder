import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../../queues/queues.module';
import {
  TELEGRAM_JOB_NEW_ORDER,
  TELEGRAM_JOB_STORE_APPROVED,
  TELEGRAM_JOB_STORE_REJECTED,
  TELEGRAM_JOB_VERIFICATION_APPROVED,
  TELEGRAM_JOB_ORDER_STATUS_CHANGED,
  TELEGRAM_JOB_CHAT_MESSAGE,
} from '../../../queues/telegram-notification.processor';

export interface NotifyNewOrderData {
  sellerTelegramUsername: string;
  orderNumber: string;
  storeName: string;
  itemCount: number;
  total: number;
  currency: string;
}

export interface NotifyStoreApprovedData {
  sellerTelegramUsername: string;
  storeName: string;
}

export interface NotifyStoreRejectedData {
  sellerTelegramUsername: string;
  storeName: string;
  reason?: string;
}

export interface NotifyVerificationApprovedData {
  sellerTelegramUsername: string;
}

export interface NotifyOrderStatusChangedData {
  /** Numeric Telegram chat ID as string (from User.telegramId or Seller.telegramChatId). */
  recipientChatId: string;
  /** 'BUYER' = customer-facing wording. 'SELLER' = merchant-facing wording. */
  recipientRole: 'BUYER' | 'SELLER';
  orderNumber: string;
  storeName: string;
  oldStatus: string;
  newStatus: string;
  total: number;
  currency: string;
}

export interface NotifyChatMessageData {
  /** Numeric Telegram chat ID as string. */
  recipientChatId: string;
  /** Display name shown in the notification. */
  senderName: string;
  /** Optional context: product title, store name, or order number. */
  productTitle?: string | null;
  storeName?: string | null;
  orderNumber?: string | null;
  /** Truncated message preview (~80 chars). */
  messagePreview: string;
  /** ChatThread.id — для deep link на чат через TMA `?startapp=chat_<id>`. */
  threadId: string;
  /** Кому идёт notification — определяет какой URL чата открывать. */
  recipientRole: 'BUYER' | 'SELLER';
}

@Injectable()
export class SellerNotificationService {
  private readonly logger = new Logger(SellerNotificationService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_TELEGRAM_NOTIFICATIONS)
    private readonly telegramQueue: Queue,
  ) {}

  private get notificationsEnabled(): boolean {
    return this.config.get<boolean>('features.telegramNotificationsEnabled') ?? true;
  }

  private shouldEnqueueByUsername(telegramUsername: string): boolean {
    if (!this.notificationsEnabled) return false;
    if (!telegramUsername || telegramUsername.trim() === '') return false;
    return true;
  }

  private shouldEnqueueByChatId(chatId: string | null | undefined): boolean {
    if (!this.notificationsEnabled) return false;
    if (!chatId || chatId.trim() === '') return false;
    return true;
  }

  notifyNewOrder(data: NotifyNewOrderData): void {
    if (!this.shouldEnqueueByUsername(data.sellerTelegramUsername)) return;
    this.telegramQueue.add(TELEGRAM_JOB_NEW_ORDER, data).catch((err: unknown) => {
      this.logger.error(`Failed to enqueue notifyNewOrder: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  notifyStoreApproved(data: NotifyStoreApprovedData): void {
    if (!this.shouldEnqueueByUsername(data.sellerTelegramUsername)) return;
    this.telegramQueue.add(TELEGRAM_JOB_STORE_APPROVED, data).catch((err: unknown) => {
      this.logger.error(`Failed to enqueue notifyStoreApproved: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  notifyStoreRejected(data: NotifyStoreRejectedData): void {
    if (!this.shouldEnqueueByUsername(data.sellerTelegramUsername)) return;
    this.telegramQueue.add(TELEGRAM_JOB_STORE_REJECTED, data).catch((err: unknown) => {
      this.logger.error(`Failed to enqueue notifyStoreRejected: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  notifyVerificationApproved(data: NotifyVerificationApprovedData): void {
    if (!this.shouldEnqueueByUsername(data.sellerTelegramUsername)) return;
    this.telegramQueue.add(TELEGRAM_JOB_VERIFICATION_APPROVED, data).catch((err: unknown) => {
      this.logger.error(`Failed to enqueue notifyVerificationApproved: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  /** Notify buyer (or seller for cancellation by buyer) when order status changes. */
  notifyOrderStatusChanged(data: NotifyOrderStatusChangedData): void {
    if (!this.shouldEnqueueByChatId(data.recipientChatId)) return;
    this.telegramQueue.add(TELEGRAM_JOB_ORDER_STATUS_CHANGED, data).catch((err: unknown) => {
      this.logger.error(`Failed to enqueue notifyOrderStatusChanged: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  /** Notify recipient about a new chat message from the other party. */
  notifyChatMessage(data: NotifyChatMessageData): void {
    if (!this.shouldEnqueueByChatId(data.recipientChatId)) return;
    this.telegramQueue.add(TELEGRAM_JOB_CHAT_MESSAGE, data).catch((err: unknown) => {
      this.logger.error(`Failed to enqueue notifyChatMessage: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
