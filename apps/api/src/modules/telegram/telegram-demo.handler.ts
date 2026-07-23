import { Injectable, Logger } from '@nestjs/common';
import { TelegramBotService, InlineButton, WebAppButton } from './services/telegram-bot.service';
import { RedisService } from '../../shared/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { escapeTgHtml } from '../../shared/telegram-html';
import { maskPhone } from '../../shared/pii';
import { BotKey, BotLang, t, normalizeBotLang } from './telegram-bot-i18n';
import { toLatinSlug } from 'types';

// ── Redis keys ────────────────────────────────────────────────────────────────
const TTL_LONG  = 365 * 24 * 60 * 60; // 1 год — привязка телефона
const TTL_STATE = 600;                  // 10 минут — состояние диалога

const KEY_PHONE = (chatId: string) => `tg:phone:${chatId}`;
const KEY_STATE = (chatId: string) => `tg:state:${chatId}`;
const KEY_TMP   = (chatId: string, field: string) => `tg:tmp:${chatId}:${field}`;
const KEY_LANG  = (chatId: string) => `tg:lang:${chatId}`;

// ── Публичный URL витрины ─────────────────────────────────────────────────────
// BOT-STORE-LINK-404-001: apex maxsavdo.uz занят лендингом (карта доменов 07.07),
// магазины живут на shop.maxsavdo.uz — ссылка `maxsavdo.uz/{slug}` давала 404.
function buyerBaseUrl(): string {
  return (process.env.BUYER_URL ?? 'https://shop.maxsavdo.uz').replace(/\/$/, '');
}

function storeUrl(slug: string): string {
  return `${buyerBaseUrl()}/${slug}`;
}

// TG-BOT-SELLER-TERMS-001: публичная оферта продавца живёт на web-buyer.
function offerUrl(): string {
  return `${buyerBaseUrl()}/offer`;
}

// ── Статусы заказов (BOT-I18N-FULL-001: лейблы в словаре ru/uz) ──────────────
const ORDER_STATUS_KEYS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

function orderStatusLabel(lang: BotLang, status: string): string {
  return (ORDER_STATUS_KEYS as readonly string[]).includes(status)
    ? t(lang, `order.status.${status}` as BotKey)
    : status;
}

@Injectable()
export class TelegramDemoHandler {
  private readonly logger = new Logger(TelegramDemoHandler.name);

  constructor(
    private readonly bot: TelegramBotService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Redis helpers ─────────────────────────────────────────────────────────

  async getPhone(chatId: string)                     { return this.redis.get(KEY_PHONE(chatId)); }
  async setPhone(chatId: string, phone: string)      { await this.redis.set(KEY_PHONE(chatId), phone, TTL_LONG); }
  async getState(chatId: string)                     { return this.redis.get(KEY_STATE(chatId)); }
  async setState(chatId: string, state: string)      { await this.redis.set(KEY_STATE(chatId), state, TTL_STATE); }
  async clearState(chatId: string)                   { await this.redis.del(KEY_STATE(chatId)); }
  async getTmp(chatId: string, field: string)        { return this.redis.get(KEY_TMP(chatId, field)); }
  async setTmp(chatId: string, field: string, val: string) {
    await this.redis.set(KEY_TMP(chatId, field), val, TTL_STATE);
  }

  // ── Язык бота (BOT-ONBOARDING-I18N-001) ───────────────────────────────────
  // Redis — быстрый путь; fallback — users.languageCode (default "ru" в схеме).

  async getLang(chatId: string): Promise<BotLang> {
    const cached = await this.redis.get(KEY_LANG(chatId));
    if (cached) return normalizeBotLang(cached);
    const user = await this.resolveUser(chatId);
    const lang = normalizeBotLang(user?.languageCode);
    if (user) await this.redis.set(KEY_LANG(chatId), lang, TTL_LONG);
    return lang;
  }

  async setLang(chatId: string, lang: BotLang): Promise<void> {
    await this.redis.set(KEY_LANG(chatId), lang, TTL_LONG);
    const user = await this.resolveUser(chatId);
    if (user && user.languageCode !== lang) {
      await this.prisma.user.update({ where: { id: user.id }, data: { languageCode: lang } });
    }
  }

  // ── User helpers ──────────────────────────────────────────────────────────

  private async resolveUser(chatId: string) {
    // Путь 1: Redis (юзер поделился номером через бота)
    const phone = await this.getPhone(chatId);
    if (phone) {
      const user = await this.prisma.user.findUnique({ where: { phone } });
      if (user) return user;
    }

    // Путь 2: DB по telegramId (юзер зашёл через TMA, chatId === telegramId)
    try {
      const user = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(chatId) },
      });
      if (!user) return null;

      // Кэшируем телефон в Redis для ускорения следующих обращений,
      // но только если номер реальный (не ghost вида tg_XXXXXXX)
      if (user.phone && !user.phone.startsWith('tg_')) {
        await this.setPhone(chatId, user.phone);
      }

      return user;
    } catch {
      return null;
    }
  }

  /** /orders — показывает заказы продавца или покупателя по роли */
  async handleOrdersByRole(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    if (seller) {
      await this.handleSellerOrders(chatId);
    } else {
      await this.handleBuyerOrders(chatId);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // /start — точка входа
  // ─────────────────────────────────────────────────────────────────────────

  async handleStart(chatId: string, firstName?: string, startParam?: string): Promise<void> {
    const user = await this.resolveUser(chatId);

    // BOT-ONBOARDING-I18N-001: самый первый контакт с ботом — выбор языка.
    // Один тап, запоминается на год (Redis) + в users.languageCode после
    // регистрации — онбординг длиннее не становится.
    if (!user && !(await this.redis.get(KEY_LANG(chatId)))) {
      await this.askLanguage(chatId, firstName);
      return;
    }

    const lang = await this.getLang(chatId);
    const nameSuffix = firstName ? `, <b>${escapeTgHtml(firstName)}</b>` : '';

    if (!user) {
      // Новый пользователь — просим телефон
      await this.bot.sendMessage(chatId, t(lang, 'greeting.new', { name: nameSuffix }), { parseMode: 'HTML' });
      await this.bot.sendContactRequest(chatId);
      return;
    }

    // Ghost-юзер (phone = tg_XXXXXXX): зашёл через TMA, телефон не привязан.
    // Просим поделиться контактом — это синхронизирует аккаунт.
    if (user.phone.startsWith('tg_')) {
      await this.bot.sendMessage(chatId, t(lang, 'greeting.ghost', { name: nameSuffix }), { parseMode: 'HTML' });
      await this.bot.sendContactRequest(chatId);
      return;
    }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });

    // store_<slug>: покупатель пришёл по ссылке магазина через бот.
    // Открываем TMA кнопкой — Telegram передаст start_param в webapp context.
    if (startParam?.startsWith('store_')) {
      const twaUrl = process.env.TMA_URL ?? 'https://maxsavdo.uz';
      await this.bot.sendWithWebApp(
        chatId,
        t(lang, 'deeplink.openStore'),
        [[{ text: t(lang, 'btn.openStore'), web_app: { url: twaUrl } }]],
        'HTML',
      );
      return;
    }

    // TMA-BECOME-SELLER-CTA-001: deep-link из TMA "Стать продавцом".
    // Whitelist строгий — любой другой param игнорируется, идёт обычный flow.
    if (startParam === 'become_seller' && !seller) {
      // Реальный аккаунт с телефоном, но без seller-профиля → запускаем регистрацию.
      // Phone уже подтверждён → пропускаем contact request, переиспользуем существующий 3-step flow.
      await this.setTmp(chatId, 'phone', user.phone);
      await this.setTmp(chatId, 'firstName', firstName ?? '');
      await this.startSellerRegistration(chatId);
      return;
    }

    // Обычный пользователь — показываем меню.
    // HYBRID-3 (ADR 2026-06-30): источник истины роли = users.role (как в TMA),
    // а НЕ просто наличие seller-профиля. Раньше бот показывал seller-меню любому
    // у кого есть seller-профиль, даже если users.role=BUYER → рассинхрон с TMA
    // (ROLE-SOURCE-INCONSISTENCY-001). Теперь дефолт по активному контексту;
    // переключиться можно кнопкой (switch_to_seller / switch_to_buyer).
    const displayName = firstName ?? user.phone;
    if (user.role === 'SELLER' && seller) {
      await this.showSellerMenu(chatId, displayName);
    } else {
      await this.showBuyerMenu(chatId, displayName);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Выбор языка (BOT-ONBOARDING-I18N-001)
  // ─────────────────────────────────────────────────────────────────────────

  async askLanguage(chatId: string, firstName?: string): Promise<void> {
    // firstName прокидываем через tmp — после выбора языка продолжим /start.
    if (firstName) await this.setTmp(chatId, 'startFirstName', firstName);
    await this.bot.sendInlineKeyboard(
      chatId,
      t('ru', 'chooseLanguage'),
      [[
        { text: t('ru', 'btn.lang.uz'), callback_data: 'lang_uz' },
        { text: t('ru', 'btn.lang.ru'), callback_data: 'lang_ru' },
      ]],
    );
  }

  async handleLanguageChoice(chatId: string, lang: BotLang): Promise<void> {
    await this.setLang(chatId, lang);
    const firstName = (await this.getTmp(chatId, 'startFirstName')) ?? undefined;
    await this.handleStart(chatId, firstName);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // /help
  // ─────────────────────────────────────────────────────────────────────────

  async handleHelp(chatId: string): Promise<void> {
    const lang = await this.getLang(chatId);
    const tmaUrl = process.env.TMA_URL ?? '';
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? '';
    const appLink = tmaUrl ? t(lang, 'help.appLink', { url: tmaUrl }) : '';
    const support = botUsername ? `@${botUsername}` : t(lang, 'help.supportFallback');

    await this.bot.sendMessage(chatId, t(lang, 'help.text', { support, appLink }), { parseMode: 'HTML' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Обработка поделиться контактом
  // ─────────────────────────────────────────────────────────────────────────

  async handleContact(
    chatId: string,
    phone: string,
    firstName?: string,
    username?: string,
  ): Promise<void> {
    // Сохраняем привязку phone ↔ chatId
    const normalized = phone.startsWith('+') ? phone : `+${phone}`;
    await this.setPhone(chatId, normalized);

    const lang = await this.getLang(chatId);
    await this.bot.removeKeyboard(chatId, t(lang, 'contact.received'));

    // Проверяем есть ли уже пользователь по номеру телефона
    const existing = await this.prisma.user.findUnique({ where: { phone: normalized } });

    if (existing) {
      const needsLink = existing.telegramId?.toString() !== chatId;
      if (needsLink) {
        // Ищем ghost-аккаунт с тем же chatId (tg_{chatId} phone)
        const ghost = await this.prisma.user.findFirst({
          where: { telegramId: BigInt(chatId), id: { not: existing.id }, phone: { startsWith: 'tg_' } },
          include: { buyer: { include: { orders: { take: 1 } } } },
        });

        await this.prisma.$transaction(async (tx) => {
          if (ghost) {
            const hasOrders = (ghost.buyer?.orders?.length ?? 0) > 0;
            if (!hasOrders) {
              // Ghost пустой — удаляем полностью (очищаем дубль)
              await deleteGhostUser(tx, ghost.id, ghost.buyer?.id ?? null);
              this.logger.log(`Deleted ghost userId=${ghost.id} (merged into ${existing.id})`);
            } else {
              // У ghost есть заказы — не удаляем, только снимаем chatId
              await tx.user.update({ where: { id: ghost.id }, data: { telegramId: null } });
              this.logger.warn(`Ghost userId=${ghost.id} has orders — only unlinked telegramId`);
            }
          }
          // Привязываем chatId к реальному аккаунту
          await tx.user.update({
            where: { id: existing.id },
            data: { telegramId: BigInt(chatId) },
          });
        });

        this.logger.log(`Linked telegramId=${chatId} to user id=${existing.id} phone=${maskPhone(normalized)}`);
      }

      const seller = await this.prisma.seller.findUnique({ where: { userId: existing.id } });
      if (seller) {
        // Save telegramChatId so this seller receives broadcast messages
        if (!seller.telegramChatId) {
          await this.prisma.seller.update({
            where: { id: seller.id },
            data: { telegramChatId: BigInt(chatId), telegramNotificationsActive: true },
          });
        }
        await this.showSellerMenu(chatId, firstName ?? normalized);
      } else {
        await this.showBuyerMenu(chatId, firstName ?? normalized);
      }
      return;
    }

    // Нет аккаунта по номеру. Проверяем есть ли ghost TMA-аккаунт (создан до шаринга контакта).
    // Такой аккаунт имеет phone вида tg_{chatId} — просто обновляем телефон.
    const ghost = await this.prisma.user.findUnique({ where: { telegramId: BigInt(chatId) } });
    if (ghost && ghost.phone.startsWith('tg_')) {
      await this.prisma.user.update({
        where: { id: ghost.id },
        data: { phone: normalized, isPhoneVerified: true },
      });

      const seller = await this.prisma.seller.findUnique({ where: { userId: ghost.id } });
      if (seller) {
        // Save telegramChatId so this seller receives broadcast messages
        if (!seller.telegramChatId) {
          await this.prisma.seller.update({
            where: { id: seller.id },
            data: { telegramChatId: BigInt(chatId), telegramNotificationsActive: true },
          });
        }
        // Продавец — проверяем есть ли магазин
        const store = await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null } });
        if (store) {
          await this.showSellerMenu(chatId, firstName ?? normalized);
        } else {
          // Продавец без магазина — запускаем регистрацию
          await this.setTmp(chatId, 'phone', normalized);
          await this.setTmp(chatId, 'firstName', firstName ?? '');
          await this.startSellerRegistration(chatId);
        }
      } else {
        // Покупатель — спрашиваем имя если не заполнено
        const buyer = await this.prisma.buyer.findUnique({ where: { userId: ghost.id } });
        if (!buyer?.firstName) {
          await this.setState(chatId, 'awaiting_buyer_name');
          await this.bot.sendMessage(chatId, t(lang, 'buyer.askName'), { parseMode: 'HTML' });
        } else {
          await this.showBuyerMenu(chatId, buyer.firstName);
        }
      }
      return;
    }

    // Совершенно новый пользователь — спрашиваем роль
    await this.setTmp(chatId, 'phone', normalized);
    await this.setTmp(chatId, 'firstName', firstName ?? '');
    await this.setTmp(chatId, 'username', username ?? '');

    await this.bot.sendInlineKeyboard(
      chatId,
      t(lang, 'role.question'),
      [
        [{ text: t(lang, 'btn.role.buyer'), callback_data: 'reg_buyer' }],
        [{ text: t(lang, 'btn.role.seller'), callback_data: 'reg_seller' }],
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Регистрация покупателя
  // ─────────────────────────────────────────────────────────────────────────

  async registerAsBuyer(chatId: string): Promise<void> {
    const phone     = await this.getTmp(chatId, 'phone');
    const firstName = await this.getTmp(chatId, 'firstName');

    if (!phone) { await this.handleStart(chatId); return; }

    const lang = await this.getLang(chatId);
    const user = await this.prisma.user.create({
      data: {
        phone,
        role: 'BUYER',
        isPhoneVerified: true,
        telegramId: BigInt(chatId),
        languageCode: lang,
        buyer: { create: { firstName: firstName || null } },
      },
    });

    this.logger.log(`Registered buyer userId=${user.id} phone=${maskPhone(phone)}`);
    await this.showBuyerMenu(chatId, firstName || phone);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Регистрация продавца — шаг 1: имя
  // ─────────────────────────────────────────────────────────────────────────

  async startSellerRegistration(chatId: string): Promise<void> {
    const lang = await this.getLang(chatId);
    await this.setState(chatId, 'seller_reg_name');
    await this.bot.sendMessage(chatId, t(lang, 'reg.step1'), { parseMode: 'HTML' });
  }

  async handleSellerRegName(chatId: string, text: string): Promise<void> {
    const lang = await this.getLang(chatId);
    await this.setTmp(chatId, 'sellerName', text.trim());
    await this.setState(chatId, 'seller_reg_store_name');
    await this.bot.sendMessage(chatId, t(lang, 'reg.step2'), { parseMode: 'HTML' });
  }

  async handleSellerRegStoreName(chatId: string, text: string): Promise<void> {
    const lang = await this.getLang(chatId);
    await this.setTmp(chatId, 'storeName', text.trim());
    await this.setState(chatId, 'seller_reg_store_desc');
    await this.bot.sendInlineKeyboard(
      chatId,
      t(lang, 'reg.step3'),
      [[{ text: t(lang, 'btn.skip'), callback_data: 'seller_reg_skip_desc' }]],
      'HTML',
    );
  }

  // TG-BOT-SELLER-TERMS-001: обязательное согласие с офертой перед созданием магазина.
  async askSellerTerms(chatId: string, description?: string): Promise<void> {
    const lang = await this.getLang(chatId);
    await this.setTmp(chatId, 'sellerDescription', description?.trim() ?? '');
    await this.setState(chatId, 'seller_reg_terms');
    await this.bot.sendInlineKeyboard(
      chatId,
      t(lang, 'reg.step4', { url: offerUrl() }),
      [
        [{ text: t(lang, 'btn.acceptTerms'), callback_data: 'seller_reg_terms_accept' }],
        [{ text: t(lang, 'btn.declineTerms'), callback_data: 'seller_reg_terms_decline' }],
      ],
      'HTML',
    );
  }

  async declineSellerRegistration(chatId: string): Promise<void> {
    await this.clearState(chatId);
    const lang = await this.getLang(chatId);
    await this.bot.sendMessage(chatId, t(lang, 'reg.termsDeclined'));
  }

  async finishSellerRegistration(chatId: string): Promise<void> {
    await this.clearState(chatId);

    const lang      = await this.getLang(chatId);
    const phone     = await this.getTmp(chatId, 'phone');
    const firstName = await this.getTmp(chatId, 'firstName');
    const username  = await this.getTmp(chatId, 'username');
    const sellerName = await this.getTmp(chatId, 'sellerName');
    const storeName  = await this.getTmp(chatId, 'storeName');
    const description = await this.getTmp(chatId, 'sellerDescription');

    if (!phone || !sellerName || !storeName) {
      await this.bot.sendMessage(chatId, t(lang, 'reg.error'));
      return;
    }

    // Генерируем slug из названия магазина (транслитерация + latin-only)
    const slug = toLatinSlug(storeName) + '-' + Date.now().toString(36);

    try {
      // TMA-BECOME-SELLER-CTA-001 (12.05.2026): purchaser уже может быть зарегистрирован
      // как BUYER через TMA. Старый `user.create` падал на unique(phone) → 500. Теперь:
      // - если user существует и уже seller → no-op + меню (защита от двойной регистрации)
      // - если user существует как buyer → upgrade role + create seller/store (buyer-запись
      //   сохраняется — пользователь сможет покупать в чужих магазинах)
      // - если user не существует → классический create (новый flow через /start)
      const sellerNested = {
        fullName: sellerName,
        sellerType: 'individual',
        telegramUsername: username || '',
        telegramChatId: BigInt(chatId),
        telegramNotificationsActive: true,
        termsAcceptedAt: new Date(),
        store: {
          create: {
            name: storeName,
            slug,
            description: description || null,
            city: 'Tashkent',
            telegramContactLink: username ? `https://t.me/${username}` : '',
            status: 'PENDING_REVIEW' as const,
          },
        },
      };

      const existing = await this.prisma.user.findUnique({
        where: { phone },
        include: { seller: { select: { id: true } } },
      });

      let userId: string;
      if (existing?.seller) {
        // Уже продавец — повторный вход не должен дублировать запись.
        await this.bot.sendMessage(chatId, t(lang, 'reg.alreadySeller'));
        await this.showSellerMenu(chatId, sellerName);
        return;
      }

      if (existing) {
        const updated = await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            role: 'SELLER',
            telegramId: BigInt(chatId),
            languageCode: lang,
            seller: { create: sellerNested },
          },
        });
        userId = updated.id;
        this.logger.log(`Upgraded buyer → seller userId=${userId} store=${slug}`);
      } else {
        const created = await this.prisma.user.create({
          data: {
            phone,
            role: 'SELLER',
            isPhoneVerified: true,
            telegramId: BigInt(chatId),
            languageCode: lang,
            seller: { create: sellerNested },
          },
        });
        userId = created.id;
        this.logger.log(`Registered seller userId=${userId} store=${slug}`);
      }

      // Открыть кейс модерации — иначе магазин в PENDING_REVIEW не появится в очереди
      await this.openModerationCaseForStore(userId, slug);

      await this.bot.sendInlineKeyboard(
        chatId,
        t(lang, 'store.created', { name: escapeTgHtml(storeName), url: storeUrl(escapeTgHtml(slug)) }),
        [
          [{ text: t(lang, 'btn.linkChannel'), callback_data: 'seller_link_channel' }],
          [{ text: t(lang, 'btn.renameStore'), callback_data: 'seller_rename_store' }],
          [{ text: t(lang, 'btn.skipChannel'), callback_data: 'seller_skip_channel' }],
        ],
        'HTML',
      );
    } catch (err) {
      this.logger.error(`Seller registration failed: ${err}`);
      await this.bot.sendMessage(chatId, t(lang, 'reg.errorMaybeDuplicate'));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Привязка TG канала
  // ─────────────────────────────────────────────────────────────────────────

  async handleLinkChannel(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const lang = await this.getLang(chatId);
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) { await this.handleStart(chatId); return; }

    const store = await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null } });
    if (!store) {
      // Нет магазина — сначала создаём
      await this.setState(chatId, 'seller_create_store_name');
      await this.bot.sendMessage(chatId, t(lang, 'channel.noStoreYet'), { parseMode: 'HTML' });
      return;
    }

    await this.setState(chatId, 'awaiting_channel');
    await this.bot.sendMessage(chatId, t(lang, 'channel.linkIntro'), { parseMode: 'HTML' });
  }

  async handleCreateStoreName(chatId: string, storeName: string): Promise<void> {
    await this.clearState(chatId);

    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const lang = await this.getLang(chatId);
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) { await this.handleStart(chatId); return; }

    const name = storeName.trim();
    const slug = toLatinSlug(name) + '-' + Date.now().toString(36);

    try {
      const newStore = await this.prisma.store.create({
        data: {
          sellerId: seller.id,
          name,
          slug,
          city: 'Tashkent',
          telegramContactLink: '',
          status: 'PENDING_REVIEW',
        },
      });

      // Открыть кейс модерации
      await this.openModerationCaseForStore(user.id, newStore.slug);

      // Магазин создан — переходим к привязке канала
      await this.setState(chatId, 'awaiting_channel');
      await this.bot.sendMessage(
        chatId,
        t(lang, 'store.createdLinkChannel', { name: escapeTgHtml(name) }),
        { parseMode: 'HTML' },
      );
    } catch (err) {
      this.logger.error(`Store creation failed for seller ${seller.id}: ${err}`);
      await this.bot.sendMessage(chatId, t(lang, 'store.createFailed'));
    }
  }

  async handleChannelInput(chatId: string, input: string): Promise<void> {
    await this.clearState(chatId);

    const lang = await this.getLang(chatId);
    const channelId = input.trim().startsWith('@') ? input.trim() : `@${input.trim()}`;

    // Проверяем что бот является администратором канала
    const isAdmin = await this.bot.checkBotIsAdmin(channelId);
    if (!isAdmin) {
      await this.bot.sendInlineKeyboard(
        chatId,
        t(lang, 'channel.botNotAdmin', { channel: escapeTgHtml(channelId) }),
        [[{ text: t(lang, 'btn.tryAgain'), callback_data: 'seller_link_channel' }]],
        'HTML',
      );
      return;
    }

    // Получаем название канала
    const channelTitle = await this.bot.getChannelTitle(channelId);

    // Сохраняем в БД
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) { await this.handleStart(chatId); return; }

    const store = await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null } });
    if (!store) {
      // Этого не должно быть (handleLinkChannel теперь создаёт store заранее),
      // но на всякий случай — предлагаем создать
      await this.bot.sendInlineKeyboard(
        chatId,
        t(lang, 'channel.needStoreFirst'),
        [[{ text: t(lang, 'btn.createStore'), callback_data: 'seller_link_channel' }]],
      );
      return;
    }

    await this.prisma.store.update({
      where: { id: store.id },
      data: {
        telegramChannelId: channelId,
        telegramChannelTitle: channelTitle ?? channelId,
        // Синхронизация с TMA: бот говорит «автоматически постит» —
        // значит autoPost должен быть включён сразу, без ручного шага в TMA.
        autoPostProductsToChannel: true,
      },
    });

    await this.bot.sendMessage(
      chatId,
      t(lang, 'channel.linked', { channel: escapeTgHtml(channelTitle ?? channelId) }),
      { parseMode: 'HTML' },
    );

    await this.showSellerMenu(chatId, user.phone);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Автопостинг товара в канал
  // ─────────────────────────────────────────────────────────────────────────

  async postProductToChannel(storeId: string, productId: string): Promise<void> {
    // DB-AUDIT-001-07: не публикуем товары удалённого магазина в TG-канал
    // BOT-I18N-FULL-001: пост в канале — на языке владельца магазина (его аудитория).
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      include: { seller: { include: { user: { select: { languageCode: true } } } } },
    });
    if (!store?.telegramChannelId) return;
    const lang = normalizeBotLang(store.seller?.user?.languageCode);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          include: { media: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!product) return;

    const price = `${Number(String(product.basePrice ?? 0)).toLocaleString('ru')} ${lang === 'uz' ? 'soʻm' : 'сум'}`;
    const caption = `🛍 <b>${escapeTgHtml(product.title)}</b>\n\n${product.description ? `📝 ${escapeTgHtml(product.description)}\n\n` : ''}${t(lang, 'channelPost.price', { price })}\n\n${t(lang, 'channelPost.store', { store: escapeTgHtml(store.name) })}`;

    const tmaUrl = process.env.TMA_URL ?? '';
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? '';
    const deepLink = botUsername && store.slug
      ? `https://t.me/${botUsername}?startapp=store_${store.slug}`
      : tmaUrl;

    const buttons: Array<Array<{ text: string; url: string }>> = [
      [{ text: t(lang, 'btn.openStore'), url: deepLink }],
      [{ text: t(lang, 'btn.writeSeller'), url: store.telegramContactLink ?? deepLink }],
    ];

    const imageUrls = product.images
      .map((img) => this.resolveMediaUrl(img.media as { id: string; objectKey?: string | null; bucket?: string | null }))
      .filter(Boolean) as string[];

    if (imageUrls.length >= 2) {
      // Media group: Telegram не поддерживает кнопки в sendMediaGroup,
      // поэтому шлём кнопки отдельным сообщением следом
      await this.bot.sendMediaGroupToChannel(store.telegramChannelId, imageUrls, caption, 'HTML');
      await this.bot.sendToChannel(store.telegramChannelId, t(lang, 'channelPost.more'), buttons);
    } else if (imageUrls.length === 1) {
      await this.bot.sendPhotoToChannel(store.telegramChannelId, imageUrls[0], caption, buttons, 'HTML');
    } else {
      await this.bot.sendToChannel(store.telegramChannelId, caption, buttons);
    }

    this.logger.log(`Posted product ${productId} to channel ${store.telegramChannelId} (images: ${imageUrls.length})`);
  }

  /** Создаёт кейс модерации для магазина (idempotent). Inline без ModerationTriggerService чтобы избежать cyclic DI. */
  private async openModerationCaseForStore(userId: string, storeSlug: string): Promise<void> {
    try {
      const seller = await this.prisma.seller.findUnique({ where: { userId } });
      if (!seller) return;
      const store = await this.prisma.store.findFirst({ where: { sellerId: seller.id, slug: storeSlug, deletedAt: null } });
      if (!store) return;
      const existing = await this.prisma.moderationCase.findFirst({
        where: { entityType: 'store', entityId: store.id, status: 'OPEN' },
      });
      if (!existing) {
        await this.prisma.moderationCase.create({
          data: { entityType: 'store', entityId: store.id, caseType: 'VERIFICATION', status: 'OPEN' },
        });
        this.logger.log(`Moderation case opened for store ${store.id} (bot registration)`);
      }
    } catch (err) {
      this.logger.error(`openModerationCaseForStore failed: ${err}`);
    }
  }

  private resolveMediaUrl(media: { id: string; objectKey?: string | null; bucket?: string | null }): string {
    if (!media?.objectKey) return '';
    const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');
    if (media.bucket === 'telegram') {
      return `${appUrl}/api/v1/media/proxy/${media.id}`;
    }
    const r2Base = process.env.STORAGE_PUBLIC_URL ?? '';
    if (r2Base) return `${r2Base}/${media.objectKey}`;
    return media.id && appUrl ? `${appUrl}/api/v1/media/proxy/${media.id}` : '';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Меню продавца
  // ─────────────────────────────────────────────────────────────────────────

  async showSellerMenu(chatId: string, name: string): Promise<void> {
    await this.clearState(chatId);
    const lang = await this.getLang(chatId);
    const twaUrl = process.env.TMA_URL ?? 'https://maxsavdo.uz';
    const rows: Array<Array<InlineButton | WebAppButton>> = [
      [{ text: t(lang, 'btn.openApp'), web_app: { url: twaUrl } }],
      [
        { text: t(lang, 'btn.sellerOrders'), callback_data: 'seller_orders' },
        { text: t(lang, 'btn.sellerProducts'), callback_data: 'seller_products' },
      ],
      [
        { text: t(lang, 'btn.sellerStore'), callback_data: 'seller_store' },
        { text: t(lang, 'btn.sellerStats'), callback_data: 'seller_stats' },
      ],
      [{ text: t(lang, 'btn.menuLinkChannel'), callback_data: 'seller_link_channel' }],
      // HYBRID-3: переключение в режим покупателя (покупать может любой аккаунт).
      [
        { text: t(lang, 'btn.buyerMode'), callback_data: 'switch_to_buyer' },
        { text: t(lang, 'btn.language'), callback_data: 'change_lang' },
      ],
    ];
    await this.bot.sendWithWebApp(
      chatId,
      t(lang, 'menu.seller.title', { name: name ? escapeTgHtml(name) : lang === 'uz' ? 'Sotuvchi' : 'Продавец' }),
      rows,
      'HTML',
    );
  }

  /** Направляет продавца в TMA для управления товарами */
  async handleSellerProductsInTma(chatId: string): Promise<void> {
    const tmaUrl      = process.env.TMA_URL ?? '';
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? '';

    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const lang = await this.getLang(chatId);
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    const store  = seller ? await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null } }) : null;

    // Deep link в TMA сразу на страницу товаров
    const deepLink = tmaUrl ? `${tmaUrl}` : null;
    const tmaProductsLink = botUsername
      ? `https://t.me/${botUsername}?startapp=seller_products`
      : deepLink;

    const productCount = store
      ? await this.prisma.product.count({ where: { storeId: store.id, deletedAt: null } })
      : 0;

    const text = store
      ? t(lang, 'products.title', { store: escapeTgHtml(store.name), count: String(productCount) })
      : t(lang, 'products.noStore');

    await this.bot.sendToChannel(
      chatId,
      text,
      tmaProductsLink ? [[{ text: t(lang, 'btn.openInApp'), url: tmaProductsLink }]] : undefined,
      'HTML',
    );
  }

  /** Выход из аккаунта — очищает сессию в Redis (язык tg:lang НЕ трогаем — привязан к chatId) */
  async handleLogout(chatId: string): Promise<void> {
    const lang = await this.getLang(chatId);
    const phone = await this.getPhone(chatId);
    await Promise.all([
      this.redis.del(`tg:phone:${chatId}`),
      this.redis.del(`tg:state:${chatId}`),
      ...(phone ? [this.redis.del(`tg:chatid:${phone}`)] : []),
    ]);
    await this.bot.sendInlineKeyboard(
      chatId,
      t(lang, 'logout.done'),
      [[{ text: t(lang, 'btn.loginAgain'), callback_data: 'noop' }]],
    );
    // После logout показываем /start через 1 секунду
    setTimeout(() => {
      this.handleStart(chatId).catch(() => null);
    }, 1500);
  }

  async handleSellerOrders(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const lang = await this.getLang(chatId);
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    const store  = seller ? await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null } }) : null;
    if (!store) { await this.bot.sendMessage(chatId, t(lang, 'rename.noStore')); return; }

    const orders = await this.prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (!orders.length) {
      await this.bot.sendMessage(chatId, t(lang, 'orders.none'));
      return;
    }

    const currency = lang === 'uz' ? 'soʻm' : 'сум';
    const lines = orders.map((o, i) => {
      const status = orderStatusLabel(lang, o.status);
      const amount = o.totalAmount ? `${Number(o.totalAmount).toLocaleString('ru')} ${currency}` : '—';
      return `${i + 1}. #${o.orderNumber ?? o.id.slice(-6)} | ${status}\n   💰 ${amount}`;
    });

    await this.bot.sendMessage(
      chatId,
      `${t(lang, 'orders.sellerHeader', { count: String(orders.length) })}\n\n${lines.join('\n\n')}`,
      { parseMode: 'HTML' },
    );
  }

  async handleSellerStore(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const lang = await this.getLang(chatId);
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    const store  = seller ? await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null } }) : null;
    if (!store) { await this.bot.sendMessage(chatId, t(lang, 'rename.noStore')); return; }

    const channel = store.telegramChannelId
      ? t(lang, 'store.channelLinked', { channel: escapeTgHtml(store.telegramChannelTitle ?? store.telegramChannelId) })
      : t(lang, 'store.channelNotLinked');

    await this.bot.sendInlineKeyboard(
      chatId,
      t(lang, 'store.info', {
        name: escapeTgHtml(store.name),
        url: storeUrl(escapeTgHtml(store.slug)),
        status: store.status,
        channel,
      }),
      [[{ text: t(lang, 'btn.renameStore'), callback_data: 'seller_rename_store' }]],
      'HTML',
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Смена названия магазина (BOT-ONBOARDING-I18N-001, просьба owner-а)
  // slug/ссылка НЕ меняются — иначе ломаются уже разосланные ссылки.
  // ─────────────────────────────────────────────────────────────────────────

  async handleRenameStoreStart(chatId: string): Promise<void> {
    const lang = await this.getLang(chatId);
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    const store  = seller ? await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null } }) : null;
    if (!store) { await this.bot.sendMessage(chatId, t(lang, 'rename.noStore')); return; }

    await this.setState(chatId, 'awaiting_store_rename');
    await this.bot.sendMessage(chatId, t(lang, 'rename.ask'), { parseMode: 'HTML' });
  }

  async handleStoreRenameInput(chatId: string, text: string): Promise<void> {
    await this.clearState(chatId);
    const lang = await this.getLang(chatId);
    const name = text.trim().slice(0, 100);
    if (!name) { await this.handleRenameStoreStart(chatId); return; }

    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    const store  = seller ? await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null } }) : null;
    if (!store) { await this.bot.sendMessage(chatId, t(lang, 'rename.noStore')); return; }

    await this.prisma.store.update({ where: { id: store.id }, data: { name } });
    this.logger.log(`Store ${store.id} renamed via bot: "${store.name}" → "${name}"`);

    await this.bot.sendMessage(
      chatId,
      t(lang, 'rename.done', { name: escapeTgHtml(name), url: storeUrl(escapeTgHtml(store.slug)) }),
      { parseMode: 'HTML' },
    );
  }

  async handleSellerStats(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const lang = await this.getLang(chatId);
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    const store  = seller ? await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null } }) : null;
    if (!store) { await this.bot.sendMessage(chatId, t(lang, 'rename.noStore')); return; }

    const [productCount, orderCount] = await Promise.all([
      this.prisma.product.count({ where: { storeId: store.id, deletedAt: null } }),
      this.prisma.order.count({ where: { storeId: store.id } }),
    ]);

    await this.bot.sendMessage(
      chatId,
      t(lang, 'stats.text', {
        store: escapeTgHtml(store.name),
        products: String(productCount),
        orders: String(orderCount),
      }),
      { parseMode: 'HTML' },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Меню покупателя
  // ─────────────────────────────────────────────────────────────────────────

  async showBuyerMenu(chatId: string, name: string): Promise<void> {
    await this.clearState(chatId);
    const lang = await this.getLang(chatId);
    const twaUrl = process.env.TMA_URL ?? 'https://maxsavdo.uz';
    const rows: Array<Array<InlineButton | WebAppButton>> = [
      [{ text: t(lang, 'btn.openApp'), web_app: { url: twaUrl } }],
      [{ text: t(lang, 'btn.findStore'), callback_data: 'buyer_find_store' }],
      [{ text: t(lang, 'btn.myOrders'), callback_data: 'buyer_orders' }],
    ];
    // HYBRID-3: если у аккаунта есть seller-профиль + магазин — показываем
    // переключатель в режим продавца (гибридная модель: один аккаунт обе роли).
    const switchUser = await this.resolveUser(chatId);
    if (switchUser) {
      const seller = await this.prisma.seller.findUnique({ where: { userId: switchUser.id }, select: { id: true } });
      const store = seller
        ? await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null }, select: { id: true } })
        : null;
      if (store) {
        rows.push([{ text: t(lang, 'btn.sellerMode'), callback_data: 'switch_to_seller' }]);
      }
    }
    rows.push([{ text: t(lang, 'btn.language'), callback_data: 'change_lang' }]);
    await this.bot.sendWithWebApp(chatId, t(lang, 'menu.buyer.greeting', { name: escapeTgHtml(name) }), rows, 'HTML');
  }

  // HYBRID-3: переключение активного контекста из бота (зеркалит
  // POST /auth/switch-context). Персистит users.role — единый источник истины
  // для бота и TMA.
  async handleSwitchToBuyer(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }
    // Гарантируем buyer-профиль (как ensureBuyerProfile в API).
    await this.prisma.buyer.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
    if (user.role !== 'BUYER') {
      await this.prisma.user.update({ where: { id: user.id }, data: { role: 'BUYER' } });
    }
    await this.showBuyerMenu(chatId, user.phone);
  }

  async handleSwitchToSeller(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id }, select: { id: true } });
    const store = seller
      ? await this.prisma.store.findFirst({ where: { sellerId: seller.id, deletedAt: null }, select: { id: true } })
      : null;
    if (!seller || !store) {
      // Нет магазина → нельзя в режим продавца (инвариант гибридной модели).
      const lang = await this.getLang(chatId);
      await this.bot.sendInlineKeyboard(
        chatId,
        t(lang, 'switch.needStore'),
        [[{ text: t(lang, 'btn.becomeSeller'), callback_data: 'reg_seller' }]],
        'HTML',
      );
      return;
    }
    if (user.role !== 'SELLER') {
      await this.prisma.user.update({ where: { id: user.id }, data: { role: 'SELLER' } });
    }
    await this.showSellerMenu(chatId, user.phone);
  }

  async handleBuyerFindStore(chatId: string): Promise<void> {
    const lang = await this.getLang(chatId);
    await this.setState(chatId, 'awaiting_store_slug');
    await this.bot.sendMessage(chatId, t(lang, 'find.prompt'), { parseMode: 'HTML' });
  }

  async handleStoreSlugInput(chatId: string, slug: string): Promise<void> {
    await this.clearState(chatId);

    const lang = await this.getLang(chatId);
    const store = await this.prisma.store.findFirst({ where: { slug: slug.trim().toLowerCase(), deletedAt: null } });
    if (!store) {
      await this.bot.sendInlineKeyboard(
        chatId,
        t(lang, 'find.notFound', { slug: escapeTgHtml(slug) }),
        [[{ text: t(lang, 'btn.searchAgain'), callback_data: 'buyer_find_store' }]],
        'HTML',
      );
      return;
    }

    const products = await this.prisma.product.findMany({
      where: { storeId: store.id, status: 'ACTIVE', deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const currency = lang === 'uz' ? 'soʻm' : 'сум';
    const productLines = products.length
      ? products.map((p, i) => `${i + 1}. <b>${escapeTgHtml(p.title)}</b> — ${Number(String(p.basePrice ?? 0)).toLocaleString('ru')} ${currency}`).join('\n')
      : t(lang, 'find.noProducts');

    const tmaUrl = process.env.TMA_URL ?? 'https://maxsavdo.uz';
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? '';
    const storeLink = botUsername && store.slug
      ? `https://t.me/${botUsername}?startapp=store_${store.slug}`
      : tmaUrl;
    await this.bot.sendToChannel(chatId, // sendToChannel работает и для личных чатов
      `🏪 <b>${escapeTgHtml(store.name)}</b>\n\n${store.description ? `${escapeTgHtml(store.description)}\n\n` : ''}${t(lang, 'find.productsHeader')}\n${productLines}`,
      [[{ text: t(lang, 'btn.openStore'), url: storeLink }]],
      'HTML',
    );
  }

  async handleBuyerOrders(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const lang = await this.getLang(chatId);
    const buyer = await this.prisma.buyer.findUnique({ where: { userId: user.id } });
    if (!buyer) {
      await this.bot.sendMessage(chatId, t(lang, 'orders.buyerNoneYetWithLink', { url: buyerBaseUrl() }));
      return;
    }

    const orders = await this.prisma.order.findMany({
      where: { buyerId: buyer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (!orders.length) {
      await this.bot.sendMessage(chatId, t(lang, 'orders.buyerNoneYet'));
      return;
    }

    const currency = lang === 'uz' ? 'soʻm' : 'сум';
    const lines = orders.map((o, i) => {
      const status = orderStatusLabel(lang, o.status);
      const amount = o.totalAmount ? `${Number(o.totalAmount).toLocaleString('ru')} ${currency}` : '—';
      return `${i + 1}. #${o.orderNumber ?? o.id.slice(-6)} | ${status}\n   💰 ${amount}`;
    });

    await this.bot.sendMessage(chatId, `${t(lang, 'orders.buyerHeader')}\n\n${lines.join('\n\n')}`, { parseMode: 'HTML' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Сохранение имени покупателя (state: awaiting_buyer_name)
  // ─────────────────────────────────────────────────────────────────────────

  async handleBuyerName(chatId: string, text: string): Promise<void> {
    await this.clearState(chatId);
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const parts     = text.trim().split(/\s+/);
    const firstName = parts[0] ?? '';
    const lastName  = parts.slice(1).join(' ') || null;

    await this.prisma.buyer.upsert({
      where:  { userId: user.id },
      update: { firstName, lastName },
      create: { userId: user.id, firstName, lastName },
    });

    this.logger.log(`Buyer name saved userId=${user.id} firstName=${firstName} lastName=${lastName}`);
    await this.showBuyerMenu(chatId, firstName || text.trim());
  }
}

// ─── Ghost user cascade delete helper ─────────────────────────────────────────
// Используется в handleContact и GhostCleanupService.
// tx — Prisma Interactive Transaction client.
// Порядок важен: сначала дочерние записи, потом родительские.
import type { PrismaClient } from '@prisma/client';
type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function deleteGhostUser(
  tx: TxClient,
  userId: string,
  buyerId: string | null,
): Promise<void> {
  if (buyerId) {
    // Сообщения в чатах покупателя
    await tx.chatMessage.deleteMany({ where: { thread: { buyerId } } });
    await tx.chatThread.deleteMany({ where: { buyerId } });
    // Корзина
    await tx.cartItem.deleteMany({ where: { cart: { buyerId } } });
    await tx.cart.deleteMany({ where: { buyerId } });
    // Адреса
    await tx.buyerAddress.deleteMany({ where: { buyerId } });
    // Buyer (orders у ghost пустые — проверено выше)
    await tx.buyer.delete({ where: { id: buyerId } }).catch(() => null);
  }
  // Сессии
  await tx.userSession.deleteMany({ where: { userId } });
  // Audit logs — nullable FK, просто обнуляем
  await tx.auditLog.updateMany({ where: { actorUserId: userId }, data: { actorUserId: null } });
  // Наконец пользователь
  await tx.user.delete({ where: { id: userId } });
}
