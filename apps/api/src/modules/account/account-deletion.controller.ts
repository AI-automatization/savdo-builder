import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ConfirmAccountDeletionDto } from './dto/confirm-account-deletion.dto';
import { RequestAccountDeletionUseCase } from './use-cases/request-account-deletion.use-case';
import { ConfirmAccountDeletionUseCase } from './use-cases/confirm-account-deletion.use-case';

/**
 * ACCOUNT-DELETION-OTP-001 — self-service удаление аккаунта.
 *
 * Flow:
 *   POST /me/account-deletion/request  → 6-digit TG OTP, expiry 10min
 *   POST /me/account-deletion/confirm  → verify code, soft-delete user
 *
 * Soft-delete = User.deletedAt=NOW() + status=BLOCKED + invalidate sessions.
 * Login уже отбивает таких юзеров (telegram-auth.use-case.ts L122-135).
 *
 * TODO (next turn): schedule hard-delete cron at 90 days post-deletedAt.
 *   - BullMQ scheduled job similar to subscription-expiry.processor.ts.
 *   - Query: User WHERE deletedAt < NOW() - INTERVAL '90 days' AND status='BLOCKED'.
 *   - FK-friendly hard delete: либо CASCADE через user_sessions (уже есть), либо
 *     анонимизация (phone='deleted_<id>', telegramId=null) если orders/audit_logs
 *     требуют сохранения исторических ссылок (INV-A01).
 *
 * TODO (next turn): auto-restore on login если deletedAt > NOW() - 90 дней —
 *   изменить telegram-auth.use-case.ts и verify-otp.use-case.ts.
 */
@ApiTags('account')
@ApiBearerAuth('jwt')
@Controller('me/account-deletion')
@UseGuards(JwtAuthGuard)
export class AccountDeletionController {
  constructor(
    private readonly requestDeletion: RequestAccountDeletionUseCase,
    private readonly confirmDeletion: ConfirmAccountDeletionUseCase,
  ) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 3 } }) // защита от спама удаления: 3/мин
  async requestHandler(@CurrentUser() user: JwtPayload) {
    const result = await this.requestDeletion.execute(user.sub);
    return { message: 'Deletion OTP sent to Telegram', expiresAt: result.expiresAt };
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // brute-force защита: 10/мин
  async confirmHandler(@CurrentUser() user: JwtPayload, @Body() dto: ConfirmAccountDeletionDto) {
    const result = await this.confirmDeletion.execute(user.sub, dto.code);
    return {
      message: 'Account deleted. 90-day grace period started.',
      deletedAt: result.deletedAt,
      gracePeriodDays: 90,
    };
  }
}
