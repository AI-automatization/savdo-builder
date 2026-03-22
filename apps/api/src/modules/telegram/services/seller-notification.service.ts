import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from './telegram-bot.service';
import {
  QUEUE_TELEGRAM_NOTIFICATIONS,
} from '../../../queues/queues.module';
import {
  TELEGRAM_JOB_NEW_ORDER,
  TELEGRAM_JOB_STORE_APPROVED,
  TELEGRAM_JOB_STORE_REJECTED,
  TELEGRAM_JOB_VERIFICATION_APPROVED,
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

@Injectable()
export class SellerNotificationService {
  private readonly logger = new Logger(SellerNotificationService.name);

  constructor(
    // Still injected so the processor can delegate actual Telegram calls here.
    readonly telegramBot: TelegramBotService,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_TELEGRAM_NOTIFICATIONS)
    private readonly telegramQueue: Queue,
  ) {}

  private get notificationsEnabled(): boolean {
    return this.config.get<boolean>('features.telegramNotificationsEnabled') ?? true;
  }

  private shouldEnqueue(telegramUsername: string): boolean {
    if (!this.notificationsEnabled) {
      return false;
    }
    if (!telegramUsername || telegramUsername.trim() === '') {
      return false;
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // Public notify* methods — enqueue a job, return immediately (void).
  // The actual Telegram send is performed by TelegramNotificationProcessor.
  // -------------------------------------------------------------------------

  notifyNewOrder(data: NotifyNewOrderData): void {
    if (!this.shouldEnqueue(data.sellerTelegramUsername)) {
      return;
    }
    this.telegramQueue
      .add(TELEGRAM_JOB_NEW_ORDER, data)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to enqueue notifyNewOrder: ${message}`);
      });
  }

  notifyStoreApproved(data: NotifyStoreApprovedData): void {
    if (!this.shouldEnqueue(data.sellerTelegramUsername)) {
      return;
    }
    this.telegramQueue
      .add(TELEGRAM_JOB_STORE_APPROVED, data)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to enqueue notifyStoreApproved: ${message}`);
      });
  }

  notifyStoreRejected(data: NotifyStoreRejectedData): void {
    if (!this.shouldEnqueue(data.sellerTelegramUsername)) {
      return;
    }
    this.telegramQueue
      .add(TELEGRAM_JOB_STORE_REJECTED, data)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to enqueue notifyStoreRejected: ${message}`);
      });
  }

  notifyVerificationApproved(data: NotifyVerificationApprovedData): void {
    if (!this.shouldEnqueue(data.sellerTelegramUsername)) {
      return;
    }
    this.telegramQueue
      .add(TELEGRAM_JOB_VERIFICATION_APPROVED, data)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to enqueue notifyVerificationApproved: ${message}`);
      });
  }

  // -------------------------------------------------------------------------
  // sendDirect* — called by TelegramNotificationProcessor to perform the
  // actual Telegram API call.  Separated from the enqueue path so the
  // processor never re-enqueues: it calls these awaitable methods directly.
  // -------------------------------------------------------------------------

  async sendNewOrder(data: NotifyNewOrderData): Promise<void> {
    const text =
      `📦 Новый заказ #${data.orderNumber}\n` +
      `Магазин: ${data.storeName}\n` +
      `Товаров: ${data.itemCount}\n` +
      `Сумма: ${data.total} ${data.currency}`;
    await this.telegramBot.sendMessage(`@${data.sellerTelegramUsername}`, text);
  }

  async sendStoreApproved(data: NotifyStoreApprovedData): Promise<void> {
    const text = `✅ Ваш магазин «${data.storeName}» одобрен и теперь доступен покупателям!`;
    await this.telegramBot.sendMessage(`@${data.sellerTelegramUsername}`, text);
  }

  async sendStoreRejected(data: NotifyStoreRejectedData): Promise<void> {
    const reasonLine = data.reason ? `Причина: ${data.reason}` : '';
    const text =
      `❌ Ваш магазин «${data.storeName}» отклонён.` +
      (reasonLine ? `\n${reasonLine}` : '');
    await this.telegramBot.sendMessage(`@${data.sellerTelegramUsername}`, text);
  }

  async sendVerificationApproved(data: NotifyVerificationApprovedData): Promise<void> {
    const text =
      '✅ Ваш аккаунт продавца верифицирован. Теперь вы можете создать магазин.';
    await this.telegramBot.sendMessage(`@${data.sellerTelegramUsername}`, text);
  }
}
