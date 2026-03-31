import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { appConfig } from './config/app.config';
import { dbConfig } from './config/db.config';
import { redisConfig } from './config/redis.config';
import { jwtConfig } from './config/jwt.config';
import { storageConfig } from './config/storage.config';
import { telegramConfig } from './config/telegram.config';
import { featuresConfig } from './config/features.config';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/prisma.module';
import { RedisModule } from './shared/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { StoresModule } from './modules/stores/stores.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { MediaModule } from './modules/media/media.module';
import { CartModule } from './modules/cart/cart.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ChatModule } from './modules/chat/chat.module';
import { AdminModule } from './modules/admin/admin.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './health/health.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, redisConfig, jwtConfig, storageConfig, telegramConfig, featuresConfig],
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    RedisModule,
    QueuesModule,
    AuthModule,
    UsersModule,
    SellersModule,
    StoresModule,
    CategoriesModule,
    ProductsModule,
    MediaModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    TelegramModule,
    NotificationsModule,
    ChatModule,
    AdminModule,
    ModerationModule,
    AnalyticsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
