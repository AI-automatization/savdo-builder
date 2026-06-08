import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { TelegramModule } from '../telegram/telegram.module';
import { AccountDeletionController } from './account-deletion.controller';
import { AccountDeletionRepository } from './account-deletion.repository';
import { RequestAccountDeletionUseCase } from './use-cases/request-account-deletion.use-case';
import { ConfirmAccountDeletionUseCase } from './use-cases/confirm-account-deletion.use-case';
import { OtpService } from '../auth/services/otp.service';
import { QUEUE_OTP } from '../../queues/queues.module';
import { RedisModule } from '../../shared/redis.module';

/**
 * ACCOUNT-DELETION-OTP-001
 *
 * Сидит в собственном модуле (а не внутри AuthModule) потому что:
 * (1) endpoint scope другой — /me/* require JWT, /auth/* anon.
 * (2) бизнес-логика отдельная (self-service удаление != аутентификация).
 *
 * Переиспользует AuthRepository (экспортируется AuthModule), OtpService и
 * TelegramBotService.sendMessage напрямую (минуя QUEUE_OTP — у нас уже есть
 * telegramId юзера, не нужен Redis-lookup phone→chatId).
 *
 * OtpService НЕ экспортирован AuthModule, поэтому реинстансим его локально —
 * это безопасно: он stateless (Redis + bcrypt + queue accessor).
 */
@Module({
  imports: [
    AuthModule,
    TelegramModule,
    RedisModule,
    // OtpService inject'ит QUEUE_OTP — нужно зарегистрировать BullQueue здесь
    // тоже (BullModule.registerQueue scoped per module).
    BullModule.registerQueue({ name: QUEUE_OTP }),
  ],
  controllers: [AccountDeletionController],
  providers: [
    AccountDeletionRepository,
    RequestAccountDeletionUseCase,
    ConfirmAccountDeletionUseCase,
    OtpService,
  ],
})
export class AccountDeletionModule {}
