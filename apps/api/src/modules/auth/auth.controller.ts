import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { RequestOtpUseCase } from './use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from './use-cases/verify-otp.use-case';
import { RefreshSessionUseCase } from './use-cases/refresh-session.use-case';
import { LogoutSessionUseCase } from './use-cases/logout-session.use-case';
import { GetMeUseCase } from './use-cases/get-me.use-case';
import { TelegramAuthUseCase } from './use-cases/telegram-auth.use-case';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@ApiBearerAuth('jwt')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly requestOtp: RequestOtpUseCase,
    private readonly verifyOtp: VerifyOtpUseCase,
    private readonly refreshSession: RefreshSessionUseCase,
    private readonly logoutSession: LogoutSessionUseCase,
    private readonly getMe: GetMeUseCase,
    private readonly telegramAuth: TelegramAuthUseCase,
  ) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // TMA initData verify: до 10/мин
  async telegramAuthHandler(@Body() dto: TelegramAuthDto) {
    return this.telegramAuth.execute(dto.initData);
  }

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } }) // защита от OTP-bomb: 5/мин на IP
  async requestOtpHandler(@Body() dto: RequestOtpDto) {
    const result = await this.requestOtp.execute(dto.phone, dto.purpose);
    return { message: 'OTP sent', expiresAt: result.expiresAt };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // brute-force OTP: 10/мин
  async verifyOtpHandler(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.verifyOtp.execute(dto.phone, dto.code, dto.purpose, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async refreshHandler(@Body() dto: RefreshTokenDto) {
    return this.refreshSession.execute(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logoutHandler(@CurrentUser() user: JwtPayload) {
    await this.logoutSession.execute(user.sessionId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMeHandler(@CurrentUser() user: JwtPayload) {
    return this.getMe.execute(user.sub);
  }
}
