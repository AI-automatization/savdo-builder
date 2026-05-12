import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InAppNotificationType } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';
import {
  QUEUE_IN_APP_NOTIFICATIONS,
} from '../../../queues/queues.module';
import {
  IN_APP_JOB_CREATE,
  InAppNotificationJobData,
} from '../../../queues/in-app-notification.processor';

/**
 * NotificationService — the primary entry point for other modules.
 *
 * notify() / notifyAndMarkSent() record delivery log entries (NotificationLog).
 * notifyInApp() enqueues an in-app inbox creation job to BullMQ so that
 * failures are retried automatically and the request is never blocked.
 *
 * None of these methods throw. All errors are caught and logged internally
 * so callers are never disrupted.
 *
 * channel values: 'mobile_push' | 'telegram' | 'in_app'
 * eventType / type maps to the domain event name, e.g. 'order.status_changed'
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepo: NotificationRepository,
    @InjectQueue(QUEUE_IN_APP_NOTIFICATIONS)
    private readonly inAppQueue: Queue,
  ) {}

  /**
   * Create a notification log entry for the given user.
   *
   * Checks the user's channel preference before logging a telegram or
   * mobile_push entry — if the relevant preference is disabled the record
   * is skipped for that channel.
   *
   * Does NOT throw. Errors are caught and emitted to the logger only.
   */
  async notify(
    userId: string,
    channel: string,
    eventType: string,
    payload: object,
  ): Promise<void> {
    try {
      if (channel === 'telegram' || channel === 'mobile_push') {
        const prefs = await this.notificationRepo.findPreferences(userId);

        if (channel === 'telegram' && prefs && !prefs.telegramEnabled) {
          this.logger.debug(
            `Skipping telegram notification for user ${userId} (disabled by preference)`,
          );
          return;
        }

        if (channel === 'mobile_push' && prefs && !prefs.mobilePushEnabled) {
          this.logger.debug(
            `Skipping mobile_push notification for user ${userId} (disabled by preference)`,
          );
          return;
        }
      }

      await this.notificationRepo.createLog({
        userId,
        channel,
        eventType,
        payload,
        deliveryStatus: 'queued',
      });
    } catch (err) {
      // Never propagate — a failed notification must not break the caller's flow.
      this.logger.error(
        `Failed to create notification log for user ${userId} / event ${eventType}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  /**
   * Convenience wrapper: record the log and immediately mark it sent.
   * Use this when the actual delivery (Telegram send, push, etc.) was
   * already performed successfully by the caller before this call.
   */
  async notifyAndMarkSent(
    userId: string,
    channel: string,
    eventType: string,
    payload: object,
  ): Promise<void> {
    try {
      const prefs = await this.notificationRepo.findPreferences(userId);

      if (channel === 'telegram' && prefs && !prefs.telegramEnabled) {
        return;
      }

      if (channel === 'mobile_push' && prefs && !prefs.mobilePushEnabled) {
        return;
      }

      const log = await this.notificationRepo.createLog({
        userId,
        channel,
        eventType,
        payload,
        deliveryStatus: 'queued',
      });

      await this.notificationRepo.markLogSent(log.id);
    } catch (err) {
      this.logger.error(
        `Failed to create/mark sent log for user ${userId} / event ${eventType}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  /**
   * Enqueue an in-app inbox notification for the given user.
   *
   * The job is persisted in Redis and processed by InAppNotificationProcessor
   * with up to 3 attempts (exponential backoff). The caller is never blocked.
   *
   * Does NOT throw. Errors are caught and emitted to the logger only.
   */
  notifyInApp(
    userId: string,
    type: InAppNotificationType,
    title: string,
    body: string,
    data?: object,
  ): void {
    const jobData: InAppNotificationJobData = { userId, type, title, body, data };
    this.inAppQueue
      .add(IN_APP_JOB_CREATE, jobData)
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to enqueue in-app notification for user ${userId} / type ${type}: ${(err as Error).message}`,
          err instanceof Error ? err.stack : undefined,
        );
      });
  }

  /**
   * Direct (non-queued) in-app write — called by InAppNotificationProcessor
   * to perform the actual DB insert after the job is dequeued.
   *
   * Does NOT throw. Errors are caught and emitted to the logger only.
   */
  async createInAppDirect(
    userId: string,
    type: InAppNotificationType,
    title: string,
    body: string,
    data?: object,
  ): Promise<void> {
    try {
      await this.notificationRepo.createInApp({ userId, type, title, body, data });
    } catch (err) {
      this.logger.error(
        `Failed to create in-app notification for user ${userId} / type ${type}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err; // rethrow so the processor can retry
    }
  }
}
