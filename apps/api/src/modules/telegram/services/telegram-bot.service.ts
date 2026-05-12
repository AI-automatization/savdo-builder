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

    // Регистрируем команды в меню бота
    try {
      await axios.post(`${this.apiBase}/setMyCommands`, {
        commands: [
          { command: 'start',    description: 'Главное меню' },
          { command: 'menu',     description: 'Открыть меню' },
          { command: 'help',     description: 'Помощь и информация' },
          { command: 'orders',   description: 'Мои заказы' },
          { command: 'store',    description: 'Мой магазин (для продавцов)' },
          { command: 'products', description: 'Управление товарами (для продавцов)' },
          { command: 'logout',   description: 'Выйти из аккаунта' },
        ],
      });
      this.logger.log('Telegram bot commands registered');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to register bot commands: ${msg}`);
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

  /**
   * Send a media group of PHOTOS to a channel (Telegram API: sendMediaGroup, type='photo').
   *
   * Каждый элемент `photos[]` — это либо:
   *   - photo file_id (из ответа sendPhoto/photo[].file_id), либо
   *   - публичный HTTPS URL фото (Telegram скачает и сам обработает).
   *
   * ⚠️ Document file_id из sendDocument upload здесь НЕ работает. Используй
   * `ChannelMediaResolverService.resolveForChannelSend()` чтобы получить
   * правильный photo-источник.
   *
   * Возвращает массив `photo.file_id` из ответа Telegram (для каждого photo
   * в группе) — позволяет закэшировать photoFileId для следующих публикаций.
   * При ошибке возвращает `null` и логирует.
   */
  async sendMediaGroupToChannel(
    channelId: string,
    photos: string[],
    caption: string,
    parseMode?: 'HTML' | 'Markdown',
  ): Promise<string[] | null> {
    if (!this.botToken || photos.length < 2) return null;
    const media = photos.slice(0, 10).map((src, i) => ({
      type: 'photo' as const,
      media: src,
      ...(i === 0 ? { caption, ...(parseMode ? { parse_mode: parseMode } : {}) } : {}),
    }));
    try {
      const res = await axios.post<{ result?: Array<{ photo?: Array<{ file_id: string }> }> }>(
        `${this.apiBase}/sendMediaGroup`,
        { chat_id: channelId, media },
      );
      // sendMediaGroup возвращает массив messages, каждый с photo[] (sizes).
      // Берём самый большой размер (последний в массиве) для file_id-кэша.
      return (res.data.result ?? [])
        .map((m) => m.photo?.[m.photo.length - 1]?.file_id ?? '')
        .filter(Boolean);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`sendMediaGroupToChannel failed for ${channelId}: ${msg}`);
      return null;
    }
  }

  /**
   * Send a single PHOTO to a channel via Telegram API sendPhoto.
   *
   * `photo` — это либо photo file_id, либо публичный HTTPS URL.
   * ⚠️ Document file_id здесь не сработает (API ограничение).
   *
   * Возвращает `photo.file_id` (наибольший размер) из ответа Telegram,
   * либо `null` при ошибке.
   */
  async sendPhotoToChannel(
    channelId: string,
    photo: string,
    caption: string,
    urlButtons?: Array<Array<{ text: string; url: string }>>,
    parseMode?: 'HTML' | 'Markdown',
  ): Promise<string | null> {
    if (!this.botToken) return null;
    try {
      const res = await axios.post<{ result?: { photo?: Array<{ file_id: string }> } }>(
        `${this.apiBase}/sendPhoto`,
        {
          chat_id: channelId,
          photo,
          caption,
          ...(parseMode ? { parse_mode: parseMode } : {}),
          ...(urlButtons ? { reply_markup: { inline_keyboard: urlButtons } } : {}),
        },
      );
      const sizes = res.data.result?.photo ?? [];
      return sizes[sizes.length - 1]?.file_id ?? null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`sendPhotoToChannel failed for ${channelId}: ${msg}`);
      return null;
    }
  }
}
