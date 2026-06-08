import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { AccountDeletionRepository } from '../account-deletion.repository';
import { OtpService } from '../../auth/services/otp.service';
import { AuthRepository } from '../../auth/repositories/auth.repository';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const OTP_EXPIRY_MINUTES = 10; // дольше login-OTP (5min) — пользователь читает предупреждение
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW_MINUTES = 30;

/**
 * POST /me/account-deletion/request
 *
 * Генерирует 6-значный OTP, хеширует bcrypt'ом, кладёт в account_deletion_otps,
 * отправляет код напрямую в Telegram через TelegramBotService.sendMessage
 * (а НЕ через QUEUE_OTP) — пользователь уже авторизован, у нас есть его
 * telegramId, и нам не нужна Redis-маппа phone→chatId.
 */
@Injectable()
export class RequestAccountDeletionUseCase {
  private readonly logger = new Logger(RequestAccountDeletionUseCase.name);

  constructor(
    private readonly accountDeletionRepo: AccountDeletionRepository,
    private readonly authRepo: AuthRepository,
    private readonly otpService: OtpService,
    private readonly tg: TelegramBotService,
  ) {}

  async execute(userId: string): Promise<{ expiresAt: Date }> {
    // Rate limit: max 3 OTP requests per 30 minutes per user.
    const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MINUTES * 60 * 1000);
    const recentCount = await this.accountDeletionRepo.countRecentOtps(userId, windowStart);
    if (recentCount >= OTP_RATE_LIMIT) {
      throw new DomainException(
        ErrorCode.OTP_SEND_LIMIT,
        'Слишком много запросов на удаление. Попробуйте через 30 минут.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw new DomainException(ErrorCode.UNAUTHORIZED, 'User not found', HttpStatus.UNAUTHORIZED);
    }

    // Нужен telegramId для отправки кода. findUserById не отдаёт telegramId —
    // дотягиваем через findUserByPhone (там include buyer/seller, есть всё).
    const full = await this.authRepo.findUserByPhone(user.phone);
    const telegramId = full?.telegramId;
    if (!telegramId) {
      throw new DomainException(
        ErrorCode.TELEGRAM_NOT_LINKED,
        'Telegram не привязан. Откройте бот и поделитесь номером, чтобы получить код удаления.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const code = this.otpService.generateCode();
    const codeHash = await this.otpService.hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.accountDeletionRepo.createOtp({ userId, codeHash, expiresAt });

    // TG OTP only — Eskiz запрещён (CLAUDE.md rule 0).
    // Не уходим через QUEUE_OTP / OtpProcessor — там job.data завязан на
    // phone→chatId Redis-маппе, а тут у нас уже telegramId. Шлём напрямую.
    const text =
      `⚠️ Код для УДАЛЕНИЯ аккаунта: <b>${code}</b>\n\n` +
      `Действителен 10 минут. Если вы НЕ запрашивали удаление — просто проигнорируйте это сообщение.\n\n` +
      `После удаления у вас будет 90 дней, чтобы передумать: войдите снова через @savdo_builderBOT.`;
    const messageId = await this.tg.sendMessage(String(telegramId), text, { parseMode: 'HTML' });
    if (messageId === null) {
      // TG failed (bot token missing / chat blocked) — НЕ откатываем OTP-запись,
      // но логируем, чтобы видеть в Sentry/Railway. Пользователь увидит ошибку
      // OTP_NOT_FOUND при /confirm — лучше прямой error на /request.
      this.logger.error(`Failed to deliver deletion OTP to user=${userId} telegramId=${telegramId}`);
      throw new DomainException(
        ErrorCode.TELEGRAM_NOT_LINKED,
        'Не удалось отправить код в Telegram. Проверьте, что бот не заблокирован.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return { expiresAt };
  }
}
