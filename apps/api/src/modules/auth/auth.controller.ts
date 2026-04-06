import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestOtpUseCase } from './use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from './use-cases/verify-otp.use-case';
import { RefreshSessionUseCase } from './use-cases/refresh-session.use-case';
import { LogoutSessionUseCase } from './use-cases/logout-session.use-case';
import { GetMeUseCase } from './use-cases/get-me.use-case';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly requestOtp: RequestOtpUseCase,
    private readonly verifyOtp: VerifyOtpUseCase,
    private readonly refreshSession: RefreshSessionUseCase,
    private readonly logoutSession: LogoutSessionUseCase,
    private readonly getMe: GetMeUseCase,
  ) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtpHandler(@Body() dto: RequestOtpDto) {
    const result = await this.requestOtp.execute(dto.phone, dto.purpose);
    return { message: 'OTP sent', expiresAt: result.expiresAt };
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async otpSendHandler(@Body() dto: RequestOtpDto) {
    const result = await this.requestOtp.execute(dto.phone, dto.purpose);
    return { message: 'OTP sent', expiresAt: result.expiresAt };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtpHandler(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.verifyOtp.execute(dto.phone, dto.code, dto.purpose, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async otpVerifyHandler(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.verifyOtp.execute(dto.phone, dto.code, dto.purpose, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
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
