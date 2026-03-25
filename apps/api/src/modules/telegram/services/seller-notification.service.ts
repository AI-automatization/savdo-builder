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
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_TELEGRAM_NOTIFICATIONS)
    private readonly telegramQueue: Queue,
  ) {}

  private get notificationsEnabled(): boolean {
    return this.config.get<boolean>('features.telegramNotificationsEnabled') ?? true;
  }

  private shouldEnqueue(telegramUsername: string): boolean {
    if (!this.notificationsEnabled) return false;
    if (!telegramUsername || telegramUsername.trim() === '') return false;
    return true;
  }

  notifyNewOrder(data: NotifyNewOrderData): void {
    if (!this.shouldEnqueue(data.sellerTelegramUsername)) return;
    this.telegramQueue.add(TELEGRAM_JOB_NEW_ORDER, data).catch((err: unknown) => {
      this.logger.error(`Failed to enqueue notifyNewOrder: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  notifyStoreApproved(data: NotifyStoreApprovedData): void {
    if (!this.shouldEnqueue(data.sellerTelegramUsername)) return;
    this.telegramQueue.add(TELEGRAM_JOB_STORE_APPROVED, data).catch((err: unknown) => {
      this.logger.error(`Failed to enqueue notifyStoreApproved: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  notifyStoreRejected(data: NotifyStoreRejectedData): void {
    if (!this.shouldEnqueue(data.sellerTelegramUsername)) return;
    this.telegramQueue.add(TELEGRAM_JOB_STORE_REJECTED, data).catch((err: unknown) => {
      this.logger.error(`Failed to enqueue notifyStoreRejected: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  notifyVerificationApproved(data: NotifyVerificationApprovedData): void {
    if (!this.shouldEnqueue(data.sellerTelegramUsername)) return;
    this.telegramQueue.add(TELEGRAM_JOB_VERIFICATION_APPROVED, data).catch((err: unknown) => {
      this.logger.error(`Failed to enqueue notifyVerificationApproved: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
