import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { dbConfig } from './config/db.config';
import { redisConfig } from './config/redis.config';
import { jwtConfig } from './config/jwt.config';
import { storageConfig } from './config/storage.config';
import { telegramConfig } from './config/telegram.config';
import { featuresConfig } from './config/features.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        dbConfig,
        redisConfig,
        jwtConfig,
        storageConfig,
        telegramConfig,
        featuresConfig,
      ],
    }),
    // Modules will be added here as they are implemented:
    // DatabaseModule,
    // AuthModule,
    // UsersModule,
    // SellersModule,
    // StoresModule,
    // CategoriesModule,
    // ProductsModule,
    // CartModule,
    // CheckoutModule,
    // OrdersModule,
    // ChatModule,
    // NotificationsModule,
    // MediaModule,
    // ModerationModule,
    // AdminModule,
    // AnalyticsModule,
  ],
})
export class AppModule {}
