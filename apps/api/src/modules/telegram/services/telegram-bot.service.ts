import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SendMessageOptions {
  parseMode?: 'HTML' | 'Markdown';
}

@Injectable()
export class TelegramBotService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly botToken: string;
  private readonly apiBase: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('telegram.botToken') ?? '';
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
  }

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') return;

    const appUrl = this.config.get<string>('APP_URL') ?? process.env.APP_URL;
    if (!this.botToken || !appUrl) {
      this.logger.warn('Telegram webhook not registered: TELEGRAM_BOT_TOKEN or APP_URL missing');
      return;
    }

    const webhookUrl = `${appUrl}/api/v1/telegram/webhook`;
    const secret = this.config.get<string>('telegram.webhookSecret');

    try {
      await axios.post(`${this.apiBase}/setWebhook`, {
        url: webhookUrl,
        ...(secret ? { secret_token: secret } : {}),
        allowed_updates: ['message'],
      });
      this.logger.log(`Telegram webhook registered → ${webhookUrl}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to register Telegram webhook: ${msg}`);
    }
  }

  async sendMessage(
    chatId: string,
    text: string,
    options: SendMessageOptions = {},
  ): Promise<void> {
    if (!this.botToken) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not configured — cannot send message');
      return;
    }

    try {
      await axios.post(`${this.apiBase}/sendMessage`, {
        chat_id: chatId,
        text,
        ...(options.parseMode ? { parse_mode: options.parseMode } : {}),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to send Telegram message to ${chatId}: ${message}`,
      );
      // Non-critical — swallow the error
    }
  }

  async sendContactRequest(chatId: string): Promise<void> {
    if (!this.botToken) return;

    try {
      await axios.post(`${this.apiBase}/sendMessage`, {
        chat_id: chatId,
        text: 'Нажмите кнопку ниже, чтобы поделиться номером телефона:',
        reply_markup: {
          keyboard: [[{ text: '📱 Поделиться номером', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send contact request to ${chatId}: ${msg}`);
    }
  }

  async removeKeyboard(chatId: string, text: string): Promise<void> {
    if (!this.botToken) return;

    try {
      await axios.post(`${this.apiBase}/sendMessage`, {
        chat_id: chatId,
        text,
        reply_markup: { remove_keyboard: true },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to remove keyboard for ${chatId}: ${msg}`);
    }
  }
}
