import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TelegramBotService } from './services/telegram-bot.service';
import { SellerNotificationService } from './services/seller-notification.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramDemoHandler } from './telegram-demo.handler';
import { TelegramNotificationProcessor } from '../../queues/telegram-notification.processor';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../queues/queues.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_TELEGRAM_NOTIFICATIONS }),
    // Не импортируем SellersModule/StoresModule/etc — они создают цикл через AuthModule.
    // TelegramDemoHandler использует PrismaService напрямую (глобальный провайдер).
  ],
  controllers: [TelegramWebhookController],
  providers: [
    TelegramBotService,
    SellerNotificationService,
    TelegramNotificationProcessor,
    TelegramDemoHandler,
  ],
  exports: [TelegramBotService, SellerNotificationService],
})
export class TelegramModule {}
