import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from './services/telegram-bot.service';
import { RedisService } from '../../shared/redis.service';

// TTL for phone → chatId mapping: 1 year
const CHAT_ID_TTL = 365 * 24 * 60 * 60;
export const TELEGRAM_CHAT_ID_KEY = (phone: string) => `tg:chatid:${phone}`;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name?: string; username?: string };
    chat: { id: number };
    text?: string;
    contact?: {
      phone_number: string;
      user_id?: number;
    };
  };
}

@Controller('telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private readonly telegramBot: TelegramBotService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleUpdate(
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ) {
    // Verify webhook secret if configured
    const expectedSecret = this.config.get<string>('telegram.webhookSecret');
    if (expectedSecret && secretToken !== expectedSecret) {
      this.logger.warn('Webhook secret mismatch — ignoring update');
      return { ok: true };
    }

    const message = update.message;
    if (!message) return { ok: true };

    const chatId = String(message.chat.id);

    // /start command — ask user to share phone
    if (message.text === '/start') {
      const botUsername = this.config.get<string>('telegram.botUsername');
      await this.telegramBot.sendMessage(
        chatId,
        `👋 Добро пожаловать в @${botUsername}!\n\nПоделитесь вашим номером телефона, чтобы получать OTP коды для входа в Savdo.`,
      );
      await this.telegramBot.sendContactRequest(chatId);
      return { ok: true };
    }

    // User shared contact — store phone → chatId in Redis
    if (message.contact) {
      const rawPhone = message.contact.phone_number.replace(/\s/g, '');
      // Normalise to +998XXXXXXXXX
      const phone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;

      await this.redis.set(TELEGRAM_CHAT_ID_KEY(phone), chatId, CHAT_ID_TTL);
      this.logger.log(`Linked Telegram chatId=${chatId} to phone=${phone}`);

      await this.telegramBot.removeKeyboard(
        chatId,
        `✅ Готово! Номер ${phone} привязан.\n\nТеперь вы будете получать OTP коды для входа в Savdo прямо сюда.`,
      );
      return { ok: true };
    }

    // Unknown message — friendly hint
    await this.telegramBot.sendMessage(
      chatId,
      `Этот бот отправляет OTP коды для входа в Savdo.\nНапишите /start чтобы привязать ваш номер телефона.`,
    );

    return { ok: true };
  }
}
