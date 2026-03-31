import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TelegramBotService } from './services/telegram-bot.service';
import { SellerNotificationService } from './services/seller-notification.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramNotificationProcessor } from '../../queues/telegram-notification.processor';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../queues/queues.module';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_TELEGRAM_NOTIFICATIONS })],
  controllers: [TelegramWebhookController],
  providers: [TelegramBotService, SellerNotificationService, TelegramNotificationProcessor],
  exports: [TelegramBotService, SellerNotificationService],
})
export class TelegramModule {}
