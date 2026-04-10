import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from './services/telegram-bot.service';
import { TelegramDemoHandler } from './telegram-demo.handler';
import { RedisService } from '../../shared/redis.service';

const TTL_LONG = 365 * 24 * 60 * 60;
export const TELEGRAM_CHAT_ID_KEY = (phone: string)  => `tg:chatid:${phone}`;
export const TELEGRAM_PHONE_KEY   = (chatId: string) => `tg:phone:${chatId}`;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name?: string; last_name?: string; username?: string };
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
    private readonly bot: TelegramBotService,
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
    const expected = this.config.get<string>('telegram.webhookSecret');
    if (expected && secretToken !== expected) return { ok: true };

    try {
      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
        return { ok: true };
      }
      if (update.message) {
        await this.handleMessage(update.message);
      }
    } catch (err: unknown) {
      // Никогда не возвращаем ошибку Telegram — иначе он будет спамить повторами
      const chatId = update.message?.chat.id ?? update.callback_query?.from.id;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Bot handler crashed [chatId=${chatId}]: ${msg}`);
      if (chatId) {
        await this.bot.sendMessage(String(chatId), '⚠️ Что-то пошло не так. Попробуйте ещё раз или напишите /start').catch(() => null);
      }
    }

    return { ok: true };
  }

  // ── Message ───────────────────────────────────────────────────────────────

  private async handleMessage(msg: NonNullable<TelegramUpdate['message']>) {
    const chatId    = String(msg.chat.id);
    const firstName = msg.from.first_name;
    const username  = msg.from.username;

    // /start | /menu
    if (msg.text === '/start' || msg.text === '/menu') {
      await this.demo.handleStart(chatId, firstName);
      return;
    }

    // /help
    if (msg.text === '/help') {
      await this.demo.handleHelp(chatId);
      return;
    }

    // /orders — seller видит свои заказы, buyer — свои
    if (msg.text === '/orders') {
      await this.demo.handleOrdersByRole(chatId);
      return;
    }

    // /store
    if (msg.text === '/store') {
      await this.demo.handleSellerStore(chatId);
      return;
    }

    // Контакт (телефон)
    if (msg.contact) {
      const raw   = msg.contact.phone_number.replace(/\s/g, '');
      const phone = raw.startsWith('+') ? raw : `+${raw}`;

      // Двустороннее хранение для OTP совместимости
      await Promise.all([
        this.redis.set(TELEGRAM_CHAT_ID_KEY(phone), chatId, TTL_LONG),
        this.redis.set(TELEGRAM_PHONE_KEY(chatId), phone, TTL_LONG),
      ]);

      await this.demo.handleContact(chatId, phone, firstName, username);
      return;
    }

    // State machine
    const state = await this.demo.getState(chatId);

    if (msg.text) {
      switch (state) {
        case 'awaiting_store_slug':    await this.demo.handleStoreSlugInput(chatId, msg.text); return;
        case 'awaiting_channel':       await this.demo.handleChannelInput(chatId, msg.text);   return;
        case 'seller_reg_name':        await this.demo.handleSellerRegName(chatId, msg.text);  return;
        case 'seller_reg_store_name':  await this.demo.handleSellerRegStoreName(chatId, msg.text); return;
        case 'seller_reg_store_desc':  await this.demo.finishSellerRegistration(chatId, msg.text); return;
      }
    }

    // Fallback — показать меню
    await this.demo.handleStart(chatId, firstName);
  }

  // ── Callback query ────────────────────────────────────────────────────────

  private async handleCallbackQuery(cq: NonNullable<TelegramUpdate['callback_query']>) {
    const chatId = String(cq.from.id);
    const data   = cq.data ?? '';

    await this.bot.answerCallbackQuery(cq.id);

    // Регистрация
    if (data === 'reg_buyer')  { await this.demo.registerAsBuyer(chatId);         return; }
    if (data === 'reg_seller') { await this.demo.startSellerRegistration(chatId); return; }
    if (data === 'seller_reg_skip_desc') { await this.demo.finishSellerRegistration(chatId); return; }

    // Продавец
    if (data === 'seller_orders')       { await this.demo.handleSellerOrders(chatId);  return; }
    if (data === 'seller_store')        { await this.demo.handleSellerStore(chatId);   return; }
    if (data === 'seller_stats')        { await this.demo.handleSellerStats(chatId);   return; }
    if (data === 'seller_link_channel') { await this.demo.handleLinkChannel(chatId);   return; }
    if (data === 'seller_skip_channel') { await this.demo.showSellerMenu(chatId, ''); return; }

    // Покупатель
    if (data === 'buyer_find_store') { await this.demo.handleBuyerFindStore(chatId); return; }
    if (data === 'buyer_orders')     { await this.demo.handleBuyerOrders(chatId);    return; }

    if (data.startsWith('open_store_')) {
      const slug        = data.replace('open_store_', '');
      const tmaUrl      = process.env.TMA_URL ?? '';
      const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? '';
      const url = botUsername && slug
        ? `https://t.me/${botUsername}?startapp=store_${slug}`
        : tmaUrl;
      await this.bot.sendToChannel(chatId, `🔗 Открыть магазин:`, [[{ text: '🛒 Открыть', url }]], 'HTML');
      return;
    }

    // noop — кнопки в постах канала (там обработка не нужна)
    if (data === 'noop') return;

    this.logger.warn(`Unknown callback: ${data}`);
  }
}
