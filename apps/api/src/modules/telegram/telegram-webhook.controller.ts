import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from './services/telegram-bot.service';
import { TelegramDemoHandler } from './telegram-demo.handler';
import { RedisService } from '../../shared/redis.service';

const CHAT_ID_TTL      = 365 * 24 * 60 * 60;
export const TELEGRAM_CHAT_ID_KEY  = (phone: string)  => `tg:chatid:${phone}`;
export const TELEGRAM_PHONE_KEY    = (chatId: string) => `tg:phone:${chatId}`;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name?: string; username?: string };
    chat: { id: number };
    text?: string;
    contact?: { phone_number: string; user_id?: number };
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name?: string };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
}

@Controller('telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private readonly telegramBot: TelegramBotService,
    private readonly demo: TelegramDemoHandler,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleUpdate(
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ) {
    // Verify webhook secret
    const expectedSecret = this.config.get<string>('telegram.webhookSecret');
    if (expectedSecret && secretToken !== expectedSecret) {
      this.logger.warn('Webhook secret mismatch — ignoring');
      return { ok: true };
    }

    // ── Callback query (inline button press) ─────────────────────────────
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
      return { ok: true };
    }

    // ── Text message ──────────────────────────────────────────────────────
    if (update.message) {
      await this.handleMessage(update.message);
    }

    return { ok: true };
  }

  // ── Message handler ───────────────────────────────────────────────────────

  private async handleMessage(message: NonNullable<TelegramUpdate['message']>) {
    const chatId = String(message.chat.id);
    const firstName = message.from.first_name;

    // /start
    if (message.text === '/start') {
      await this.demo.handleStart(chatId, firstName);
      return;
    }

    // Contact shared — link phone ↔ chatId
    if (message.contact) {
      const rawPhone = message.contact.phone_number.replace(/\s/g, '');
      const phone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;

      await Promise.all([
        this.redis.set(TELEGRAM_CHAT_ID_KEY(phone), chatId, CHAT_ID_TTL),
        this.redis.set(TELEGRAM_PHONE_KEY(chatId), phone, CHAT_ID_TTL),
      ]);

      this.logger.log(`Linked chatId=${chatId} ↔ phone=${phone}`);

      await this.telegramBot.removeKeyboard(
        chatId,
        `✅ Номер ${phone} привязан! Загружаю ваш аккаунт...`,
      );

      await this.demo.handleStart(chatId, firstName);
      return;
    }

    // State-aware text input
    const state = await this.demo.getState(chatId);

    if (state === 'awaiting_store_slug' && message.text) {
      await this.demo.handleStoreSlugInput(chatId, message.text);
      return;
    }

    // Unknown — show menu or hint
    const phone = await this.demo.getPhone(chatId);
    if (phone) {
      await this.demo.handleStart(chatId, firstName);
    } else {
      await this.telegramBot.sendMessage(
        chatId,
        `Напишите /start чтобы войти в аккаунт.`,
      );
    }
  }

  // ── Callback query handler ────────────────────────────────────────────────

  private async handleCallbackQuery(cq: NonNullable<TelegramUpdate['callback_query']>) {
    const chatId = String(cq.from.id);
    const data = cq.data ?? '';

    await this.telegramBot.answerCallbackQuery(cq.id);

    switch (true) {
      // Seller
      case data === 'seller_orders': await this.demo.handleSellerOrders(chatId); break;
      case data === 'seller_store':  await this.demo.handleSellerStore(chatId);  break;
      case data === 'seller_stats':  await this.demo.handleSellerStats(chatId);  break;

      // Buyer
      case data === 'buyer_find_store': await this.demo.handleBuyerFindStore(chatId); break;
      case data === 'buyer_orders':     await this.demo.handleBuyerOrders(chatId);    break;

      // Open store link (just info message)
      case data.startsWith('open_store_'): {
        const slug = data.replace('open_store_', '');
        await this.telegramBot.sendMessage(
          chatId,
          `🔗 Откройте магазин в браузере:\nsavdo.uz/${slug}`,
        );
        break;
      }

      default:
        this.logger.warn(`Unknown callback_data: ${data}`);
    }
  }
}
