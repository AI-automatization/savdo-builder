import { Injectable, NotFoundException } from '@nestjs/common';
import { InAppNotification, NotificationLog, NotificationPreference } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ErrorCode } from '../../../shared/constants/error-codes';

// ─────────────────────────────────────────────
// NotificationLog (delivery audit log) types
// ─────────────────────────────────────────────

export interface CreateNotificationLogData {
  userId: string;
  channel: string;
  eventType: string;
  payload: object;
  deliveryStatus?: string;
}

export interface NotificationLogFilters {
  channel?: string;
  eventType?: string;
  deliveryStatus?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedNotificationLogs {
  logs: NotificationLog[];
  total: number;
}

// ─────────────────────────────────────────────
// InAppNotification (inbox) types
// ─────────────────────────────────────────────

export interface CreateInAppNotificationData {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: object;
}

export interface FindInAppByUserIdOptions {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedInAppNotifications {
  notifications: InAppNotification[];
  total: number;
  unreadCount: number;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // NotificationLog methods (delivery audit log)
  // ─────────────────────────────────────────────

  async createLog(data: CreateNotificationLogData): Promise<NotificationLog> {
    return this.prisma.notificationLog.create({
      data: {
        userId: data.userId,
        channel: data.channel,
        eventType: data.eventType,
        payload: data.payload,
        deliveryStatus: data.deliveryStatus ?? 'queued',
      },
    });
  }

  async markLogSent(id: string): Promise<NotificationLog> {
    return this.prisma.notificationLog.update({
      where: { id },
      data: {
        deliveryStatus: 'sent',
        sentAt: new Date(),
      },
    });
  }

  async markLogFailed(id: string, reason: string): Promise<NotificationLog> {
    return this.prisma.notificationLog.update({
      where: { id },
      data: {
        deliveryStatus: 'failed',
        failureReason: reason,
      },
    });
  }

  async findByUserId(
    userId: string,
    filters: NotificationLogFilters = {},
  ): Promise<PaginatedNotificationLogs> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(filters.channel ? { channel: filters.channel } : {}),
      ...(filters.eventType ? { eventType: filters.eventType } : {}),
      ...(filters.deliveryStatus ? { deliveryStatus: filters.deliveryStatus } : {}),
    };

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    return { logs, total };
  }

  async findPreferences(userId: string): Promise<NotificationPreference | null> {
    return this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
  }

  async upsertPreferences(
    userId: string,
    data: {
      mobilePushEnabled?: boolean;
      webPushEnabled?: boolean;
      telegramEnabled?: boolean;
    },
  ): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        mobilePushEnabled: data.mobilePushEnabled ?? true,
        webPushEnabled: data.webPushEnabled ?? false,
        telegramEnabled: data.telegramEnabled ?? true,
      },
      update: {
        ...(data.mobilePushEnabled !== undefined ? { mobilePushEnabled: data.mobilePushEnabled } : {}),
        ...(data.webPushEnabled !== undefined ? { webPushEnabled: data.webPushEnabled } : {}),
        ...(data.telegramEnabled !== undefined ? { telegramEnabled: data.telegramEnabled } : {}),
      },
    });
  }

  // ─────────────────────────────────────────────
  // InAppNotification methods (inbox)
  // ─────────────────────────────────────────────

  async createInApp(data: CreateInAppNotificationData): Promise<InAppNotification> {
    return this.prisma.inAppNotification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data ?? {},
      },
    });
  }

  async findInAppByUserId(
    userId: string,
    options: FindInAppByUserIdOptions = {},
  ): Promise<PaginatedInAppNotifications> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(options.unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.inAppNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inAppNotification.count({ where }),
      this.prisma.inAppNotification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  async markInAppRead(id: string, userId: string): Promise<void> {
    const notification = await this.prisma.inAppNotification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException({
        code: ErrorCode.NOTIFICATION_NOT_FOUND,
        message: 'Notification not found',
      });
    }

    if (!notification.isRead) {
      await this.prisma.inAppNotification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }
  }

  async markAllInAppRead(userId: string): Promise<void> {
    await this.prisma.inAppNotification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async deleteInApp(id: string, userId: string): Promise<void> {
    const notification = await this.prisma.inAppNotification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException({
        code: ErrorCode.NOTIFICATION_NOT_FOUND,
        message: 'Notification not found',
      });
    }

    await this.prisma.inAppNotification.delete({ where: { id } });
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.inAppNotification.count({
      where: { userId, isRead: false },
    });
  }
}
