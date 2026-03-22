import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';
import { GetNotificationLogsUseCase } from './use-cases/get-notification-logs.use-case';
import { GetPreferencesUseCase } from './use-cases/get-preferences.use-case';
import { UpdatePreferenceUseCase } from './use-cases/update-preference.use-case';
import { GetInboxUseCase } from './use-cases/get-inbox.use-case';
import { MarkInboxReadUseCase } from './use-cases/mark-inbox-read.use-case';
import { MarkAllInboxReadUseCase } from './use-cases/mark-all-inbox-read.use-case';
import { DeleteInboxNotificationUseCase } from './use-cases/delete-inbox-notification.use-case';
import { NotificationsController } from './notifications.controller';
import { InAppNotificationProcessor } from '../../queues/in-app-notification.processor';
import { QUEUE_IN_APP_NOTIFICATIONS } from '../../queues/queues.module';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_IN_APP_NOTIFICATIONS })],
  controllers: [NotificationsController],
  providers: [
    NotificationRepository,
    NotificationService,
    // Delivery log use cases
    GetNotificationLogsUseCase,
    GetPreferencesUseCase,
    UpdatePreferenceUseCase,
    // In-app inbox use cases
    GetInboxUseCase,
    MarkInboxReadUseCase,
    MarkAllInboxReadUseCase,
    DeleteInboxNotificationUseCase,
    // BullMQ processor for in-app notification jobs
    InAppNotificationProcessor,
  ],
  // NotificationService is exported so OrdersModule, StoresModule, TelegramModule, etc.
  // can inject it to record both delivery log entries (notify / notifyAndMarkSent)
  // and in-app inbox entries (notifyInApp) without importing the full module internals.
  exports: [NotificationService],
})
export class NotificationsModule {}
