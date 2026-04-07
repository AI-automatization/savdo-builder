import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface InlineButton {
  text: string;
  callback_data: string;
}

export interface WebAppButton {
  text: string;
  web_app: { url: string };
}

interface SendMessageOptions {
  parseMode?: 'HTML' | 'Markdown';
  replyMarkup?: object;
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
        allowed_updates: ['message', 'callback_query'],
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
  ): Promise<number | null> {
    if (!this.botToken) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not configured — cannot send message');
      return null;
    }

    try {
      const res = await axios.post(`${this.apiBase}/sendMessage`, {
        chat_id: chatId,
        text,
        ...(options.parseMode ? { parse_mode: options.parseMode } : {}),
        ...(options.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
      });
      return (res.data as { result?: { message_id?: number } }).result?.message_id ?? null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send Telegram message to ${chatId}: ${message}`);
      return null;
    }
  }

  async sendInlineKeyboard(
    chatId: string,
    text: string,
    buttons: InlineButton[][],
    parseMode?: 'HTML' | 'Markdown',
  ): Promise<number | null> {
    return this.sendMessage(chatId, text, {
      parseMode,
      replyMarkup: { inline_keyboard: buttons },
    });
  }

  async editMessageText(
    chatId: string,
    messageId: number,
    text: string,
    buttons?: InlineButton[][],
    parseMode?: 'HTML' | 'Markdown',
  ): Promise<void> {
    if (!this.botToken) return;
    try {
      await axios.post(`${this.apiBase}/editMessageText`, {
        chat_id: chatId,
        message_id: messageId,
        text,
        ...(parseMode ? { parse_mode: parseMode } : {}),
        ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`editMessageText failed: ${msg}`);
    }
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    if (!this.botToken) return;
    try {
      await axios.post(`${this.apiBase}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        ...(text ? { text } : {}),
      });
    } catch { /* non-critical */ }
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

  // ── Web App button ────────────────────────────────────────────────────────

  async sendWithWebApp(
    chatId: string,
    text: string,
    rows: Array<Array<InlineButton | WebAppButton>>,
    parseMode?: 'HTML' | 'Markdown',
  ): Promise<void> {
    if (!this.botToken) return;
    try {
      await axios.post(`${this.apiBase}/sendMessage`, {
        chat_id: chatId,
        text,
        ...(parseMode ? { parse_mode: parseMode } : {}),
        reply_markup: { inline_keyboard: rows },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`sendWithWebApp failed: ${msg}`);
    }
  }

  // ── Channel helpers ───────────────────────────────────────────────────────

  async checkBotIsAdmin(channelId: string): Promise<boolean> {
    if (!this.botToken) return false;
    try {
      const meRes = await axios.get(`${this.apiBase}/getMe`);
      const botId = (meRes.data as { result?: { id?: number } }).result?.id;
      if (!botId) return false;

      const res = await axios.post(`${this.apiBase}/getChatMember`, {
        chat_id: channelId,
        user_id: botId,
      });
      const status = (res.data as { result?: { status?: string } }).result?.status;
      return status === 'administrator' || status === 'creator';
    } catch {
      return false;
    }
  }

  async getChannelTitle(channelId: string): Promise<string | null> {
    if (!this.botToken) return null;
    try {
      const res = await axios.post(`${this.apiBase}/getChat`, { chat_id: channelId });
      return (res.data as { result?: { title?: string } }).result?.title ?? null;
    } catch {
      return null;
    }
  }

  async sendToChannel(
    channelId: string,
    text: string,
    urlButtons?: Array<Array<{ text: string; url: string }>>,
    parseMode?: 'HTML' | 'Markdown',
  ): Promise<void> {
    if (!this.botToken) return;
    try {
      await axios.post(`${this.apiBase}/sendMessage`, {
        chat_id: channelId,
        text,
        ...(parseMode ? { parse_mode: parseMode } : {}),
        ...(urlButtons ? { reply_markup: { inline_keyboard: urlButtons } } : {}),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`sendToChannel failed for ${channelId}: ${msg}`);
    }
  }
}
