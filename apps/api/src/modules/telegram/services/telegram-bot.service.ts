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
}
