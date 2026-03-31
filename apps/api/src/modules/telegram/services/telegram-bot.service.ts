import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SendMessageOptions {
  parseMode?: 'HTML' | 'Markdown';
}

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly botToken: string;
  private readonly apiBase: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('telegram.botToken') ?? '';
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
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
