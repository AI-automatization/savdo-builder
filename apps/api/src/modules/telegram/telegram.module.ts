import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TelegramBotService } from './services/telegram-bot.service';
import { SellerNotificationService } from './services/seller-notification.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramDemoHandler } from './telegram-demo.handler';
import { TelegramNotificationProcessor } from '../../queues/telegram-notification.processor';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from '../../queues/queues.module';
import { UsersModule } from '../users/users.module';
import { SellersModule } from '../sellers/sellers.module';
import { StoresModule } from '../stores/stores.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_TELEGRAM_NOTIFICATIONS }),
    UsersModule,
    SellersModule,
    StoresModule,
    ProductsModule,
    OrdersModule,
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
