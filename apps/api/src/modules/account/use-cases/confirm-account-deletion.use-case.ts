import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { AccountDeletionRepository } from '../account-deletion.repository';
import { OtpService } from '../../auth/services/otp.service';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const MAX_ATTEMPTS = 5;

/**
 * POST /me/account-deletion/confirm
 *
 * Проверяет 6-значный код, soft-delete user (deletedAt=NOW, status=BLOCKED),
 * инвалидирует все сессии. Отправляет финальное TG-уведомление с напоминанием
 * про 90-дневный grace period.
 *
 * 90-дневный auto-restore при логине — TODO в telegram-auth/verify-otp
 * (см. nextTurnTodo).
 */
@Injectable()
export class ConfirmAccountDeletionUseCase {
  private readonly logger = new Logger(ConfirmAccountDeletionUseCase.name);

  constructor(
    private readonly accountDeletionRepo: AccountDeletionRepository,
    private readonly otpService: OtpService,
    private readonly tg: TelegramBotService,
  ) {}

  async execute(userId: string, code: string): Promise<{ deletedAt: Date }> {
    const otp = await this.accountDeletionRepo.findActiveOtp(userId);
    if (!otp) {
      throw new DomainException(
        ErrorCode.OTP_NOT_FOUND,
        'Код не найден или истёк. Запросите новый.',
        HttpStatus.NOT_FOUND,
      );
    }

    // Brute-force protection: max 5 wrong attempts per OTP record.
    if (otp.attemptCount >= MAX_ATTEMPTS) {
      throw new DomainException(
        ErrorCode.OTP_TOO_MANY_ATTEMPTS,
        'Слишком много неверных попыток. Запросите новый код.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isValid = await this.otpService.verifyCode(code, otp.codeHash);
    if (!isValid) {
      await this.accountDeletionRepo.incrementAttempt(otp.id);
      throw new DomainException(ErrorCode.OTP_INVALID, 'Неверный код.', HttpStatus.BAD_REQUEST);
    }

    // Mark OTP consumed FIRST so /confirm becomes idempotent w.r.t. this code.
    await this.accountDeletionRepo.consumeOtp(otp.id);

    // Soft-delete user + nuke all sessions in one tx.
    const user = await this.accountDeletionRepo.softDeleteUserTx(userId);

    // Confirmation message — best-effort, не валим запрос если TG падает.
    if (user.telegramId) {
      const text =
        '🗑️ Аккаунт удалён.\n\n' +
        'Восстановление возможно в течение <b>90 дней</b> — просто войдите снова ' +
        'через @savdo_builderBOT, и аккаунт активируется автоматически.\n\n' +
        'После 90 дней данные будут стёрты безвозвратно.';
      const sent = await this.tg.sendMessage(String(user.telegramId), text, { parseMode: 'HTML' });
      if (sent === null) {
        this.logger.warn(`Deletion confirmed but TG notification failed for user=${userId}`);
      }
    }

    return { deletedAt: new Date() };
  }
}
