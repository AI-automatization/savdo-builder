import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bullmq';
import { AuthController } from './auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestOtpUseCase } from './use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from './use-cases/verify-otp.use-case';
import { RefreshSessionUseCase } from './use-cases/refresh-session.use-case';
import { LogoutSessionUseCase } from './use-cases/logout-session.use-case';
import { GetMeUseCase } from './use-cases/get-me.use-case';
import { TelegramAuthUseCase } from './use-cases/telegram-auth.use-case';
import { TelegramModule } from '../telegram/telegram.module';
import { OtpProcessor } from '../../queues/otp.processor';
import { QUEUE_OTP } from '../../queues/queues.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // secrets configured per-call in TokenService
    TelegramModule,
    BullModule.registerQueue({ name: QUEUE_OTP }),
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    OtpService,
    TokenService,
    JwtStrategy,
    JwtAuthGuard,
    RequestOtpUseCase,
    VerifyOtpUseCase,
    RefreshSessionUseCase,
    LogoutSessionUseCase,
    GetMeUseCase,
    TelegramAuthUseCase,
    OtpProcessor,
  ],
  exports: [JwtAuthGuard, TokenService],
})
export class AuthModule {}
