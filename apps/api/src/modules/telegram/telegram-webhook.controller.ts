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
    // SEC: AUDIT-API-SEC-2026-05-06 → API-WEBHOOK-SECRET-OPTIONAL-001 fix.
    // Fail-closed: в production без TELEGRAM_WEBHOOK_SECRET вообще
    // не запускаем handler. Иначе атакер мог посылать fake updates →
    // выполнение действий от лица любого chatId.
    const expected = this.config.get<string>('telegram.webhookSecret');
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    if (isProd && !expected) {
      this.logger.error('TELEGRAM_WEBHOOK_SECRET не выставлен в production — webhook отключён');
      return { ok: true };
    }
    if (expected && secretToken !== expected) {
      this.logger.warn(`Webhook отклонён: invalid secret token (got=${secretToken ? 'present' : 'missing'})`);
      return { ok: true };
    }

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

    // /products — открыть TMA на управлении товарами
    if (msg.text === '/products') {
      await this.demo.handleSellerProductsInTma(chatId);
      return;
    }

    // /logout — выход из аккаунта
    if (msg.text === '/logout') {
      await this.demo.handleLogout(chatId);
      return;
    }

    // Контакт (телефон)
    if (msg.contact) {
      // Безопасность: принимаем только собственный контакт пользователя.
      // Telegram включает user_id в контакт когда человек нажимает "Поделиться номером".
      // Если user_id не совпадает с from.id — кто-то пытается отправить чужой номер.
      if (msg.contact.user_id && msg.contact.user_id !== msg.from.id) {
        await this.bot.sendMessage(chatId, '❌ Пожалуйста, поделитесь <b>своим</b> номером телефона, используя кнопку ниже.', { parseMode: 'HTML' }).catch(() => null);
        await this.bot.sendContactRequest(chatId);
        return;
      }

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
        case 'awaiting_buyer_name':      await this.demo.handleBuyerName(chatId, msg.text);        return;
        case 'awaiting_store_slug':      await this.demo.handleStoreSlugInput(chatId, msg.text);   return;
        case 'awaiting_channel':         await this.demo.handleChannelInput(chatId, msg.text);     return;
        case 'seller_create_store_name': await this.demo.handleCreateStoreName(chatId, msg.text);  return;
        case 'seller_reg_name':          await this.demo.handleSellerRegName(chatId, msg.text);    return;
        case 'seller_reg_store_name':    await this.demo.handleSellerRegStoreName(chatId, msg.text); return;
        case 'seller_reg_store_desc':    await this.demo.finishSellerRegistration(chatId, msg.text); return;
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
    if (data === 'seller_orders')       { await this.demo.handleSellerOrders(chatId);         return; }
    if (data === 'seller_store')        { await this.demo.handleSellerStore(chatId);           return; }
    if (data === 'seller_stats')        { await this.demo.handleSellerStats(chatId);           return; }
    if (data === 'seller_products')     { await this.demo.handleSellerProductsInTma(chatId);  return; }
    if (data === 'seller_link_channel') { await this.demo.handleLinkChannel(chatId);           return; }
    if (data === 'seller_skip_channel') { await this.demo.showSellerMenu(chatId, '');         return; }

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
