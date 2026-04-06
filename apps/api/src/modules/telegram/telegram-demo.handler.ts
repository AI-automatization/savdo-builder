import { Injectable, Logger } from '@nestjs/common';
import { TelegramBotService, InlineButton } from './services/telegram-bot.service';
import { RedisService } from '../../shared/redis.service';
import { PrismaService } from '../../database/prisma.service';

// ── Redis keys ────────────────────────────────────────────────────────────────
const TTL_LONG  = 365 * 24 * 60 * 60; // 1 год — привязка телефона
const TTL_STATE = 600;                  // 10 минут — состояние диалога

const KEY_PHONE = (chatId: string) => `tg:phone:${chatId}`;
const KEY_STATE = (chatId: string) => `tg:state:${chatId}`;
const KEY_TMP   = (chatId: string, field: string) => `tg:tmp:${chatId}:${field}`;

// ── Статусы заказов ───────────────────────────────────────────────────────────
const ORDER_LABEL: Record<string, string> = {
  PENDING:   '🟡 Ожидает',
  CONFIRMED: '🔵 Подтверждён',
  SHIPPED:   '🚚 Доставляется',
  DELIVERED: '✅ Доставлен',
  CANCELLED: '❌ Отменён',
};

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

  // ── User helpers ──────────────────────────────────────────────────────────

  private async resolveUser(chatId: string) {
    const phone = await this.getPhone(chatId);
    if (!phone) return null;
    return this.prisma.user.findUnique({ where: { phone } });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // /start — точка входа
  // ─────────────────────────────────────────────────────────────────────────

  async handleStart(chatId: string, firstName?: string): Promise<void> {
    const user = await this.resolveUser(chatId);

    if (!user) {
      // Новый пользователь — просим телефон
      await this.bot.sendMessage(
        chatId,
        `👋 Привет${firstName ? `, <b>${firstName}</b>` : ''}!\n\nДобро пожаловать в <b>Savdo</b> — маркетплейс в Telegram.\n\nДля входа поделитесь номером телефона:`,
        { parseMode: 'HTML' },
      );
      await this.bot.sendContactRequest(chatId);
      return;
    }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    if (seller) {
      await this.showSellerMenu(chatId, firstName ?? user.phone);
    } else {
      await this.showBuyerMenu(chatId, firstName ?? user.phone);
    }
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

    await this.bot.removeKeyboard(chatId, `✅ Номер получен! Определяем ваш аккаунт...`);

    // Проверяем есть ли уже пользователь
    const existing = await this.prisma.user.findUnique({ where: { phone: normalized } });

    if (existing) {
      const seller = await this.prisma.seller.findUnique({ where: { userId: existing.id } });
      if (seller) {
        await this.showSellerMenu(chatId, firstName ?? normalized);
      } else {
        await this.showBuyerMenu(chatId, firstName ?? normalized);
      }
      return;
    }

    // Новый пользователь — спрашиваем роль
    await this.setTmp(chatId, 'phone', normalized);
    await this.setTmp(chatId, 'firstName', firstName ?? '');
    await this.setTmp(chatId, 'username', username ?? '');

    await this.bot.sendInlineKeyboard(
      chatId,
      `Как вы хотите зарегистрироваться?`,
      [
        [{ text: '🛍 Я покупатель', callback_data: 'reg_buyer' }],
        [{ text: '🏪 Я продавец',   callback_data: 'reg_seller' }],
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

    const user = await this.prisma.user.create({
      data: {
        phone,
        role: 'BUYER',
        isPhoneVerified: true,
        buyer: { create: { firstName: firstName || null } },
      },
    });

    this.logger.log(`Registered buyer userId=${user.id} phone=${phone}`);
    await this.showBuyerMenu(chatId, firstName || phone);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Регистрация продавца — шаг 1: имя
  // ─────────────────────────────────────────────────────────────────────────

  async startSellerRegistration(chatId: string): Promise<void> {
    await this.setState(chatId, 'seller_reg_name');
    await this.bot.sendMessage(
      chatId,
      `🏪 Регистрация продавца\n\nШаг 1/3 — Введите ваше <b>полное имя</b>:`,
      { parseMode: 'HTML' },
    );
  }

  async handleSellerRegName(chatId: string, text: string): Promise<void> {
    await this.setTmp(chatId, 'sellerName', text.trim());
    await this.setState(chatId, 'seller_reg_store_name');
    await this.bot.sendMessage(
      chatId,
      `✅ Отлично!\n\nШаг 2/3 — Введите <b>название магазина</b>:`,
      { parseMode: 'HTML' },
    );
  }

  async handleSellerRegStoreName(chatId: string, text: string): Promise<void> {
    await this.setTmp(chatId, 'storeName', text.trim());
    await this.setState(chatId, 'seller_reg_store_desc');
    await this.bot.sendInlineKeyboard(
      chatId,
      `✅ Название сохранено!\n\nШаг 3/3 — Введите <b>описание магазина</b> (или пропустите):`,
      [[{ text: '⏭ Пропустить', callback_data: 'seller_reg_skip_desc' }]],
      'HTML',
    );
  }

  async finishSellerRegistration(chatId: string, description?: string): Promise<void> {
    await this.clearState(chatId);

    const phone     = await this.getTmp(chatId, 'phone');
    const firstName = await this.getTmp(chatId, 'firstName');
    const username  = await this.getTmp(chatId, 'username');
    const sellerName = await this.getTmp(chatId, 'sellerName');
    const storeName  = await this.getTmp(chatId, 'storeName');

    if (!phone || !sellerName || !storeName) {
      await this.bot.sendMessage(chatId, '❌ Ошибка регистрации. Напишите /start и попробуйте снова.');
      return;
    }

    // Генерируем slug из названия магазина
    const slug = storeName
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s]/gi, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40) + '-' + Date.now().toString(36);

    try {
      const user = await this.prisma.user.create({
        data: {
          phone,
          role: 'SELLER',
          isPhoneVerified: true,
          seller: {
            create: {
              fullName: sellerName,
              sellerType: 'individual',
              telegramUsername: username || '',
              telegramChatId: BigInt(chatId),
              telegramNotificationsActive: true,
              store: {
                create: {
                  name: storeName,
                  slug,
                  description: description || null,
                  city: 'Tashkent',
                  telegramContactLink: username ? `https://t.me/${username}` : '',
                  status: 'DRAFT',
                },
              },
            },
          },
        },
      });

      this.logger.log(`Registered seller userId=${user.id} store=${slug}`);

      await this.bot.sendInlineKeyboard(
        chatId,
        `🎉 <b>Магазин создан!</b>\n\n🏪 ${storeName}\n🔗 savdo.uz/${slug}\n\nТеперь настройте Telegram-канал для автопостинга товаров:`,
        [
          [{ text: '📢 Привязать TG канал', callback_data: 'seller_link_channel' }],
          [{ text: '⏭ Пропустить',         callback_data: 'seller_skip_channel'  }],
        ],
        'HTML',
      );
    } catch (err) {
      this.logger.error(`Seller registration failed: ${err}`);
      await this.bot.sendMessage(chatId, '❌ Ошибка регистрации. Возможно, этот номер уже зарегистрирован.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Привязка TG канала
  // ─────────────────────────────────────────────────────────────────────────

  async handleLinkChannel(chatId: string): Promise<void> {
    await this.setState(chatId, 'awaiting_channel');
    await this.bot.sendMessage(
      chatId,
      `📢 <b>Привязка Telegram-канала</b>\n\n1. Добавьте бота как <b>администратора</b> в ваш канал\n2. Отправьте сюда <b>username канала</b>, например:\n\n<code>@mystore_channel</code>`,
      { parseMode: 'HTML' },
    );
  }

  async handleChannelInput(chatId: string, input: string): Promise<void> {
    await this.clearState(chatId);

    const channelId = input.trim().startsWith('@') ? input.trim() : `@${input.trim()}`;

    // Проверяем что бот является администратором канала
    const isAdmin = await this.bot.checkBotIsAdmin(channelId);
    if (!isAdmin) {
      await this.bot.sendInlineKeyboard(
        chatId,
        `❌ Бот не является администратором канала <code>${channelId}</code>.\n\nДобавьте бота как администратора и попробуйте снова:`,
        [[{ text: '🔄 Попробовать снова', callback_data: 'seller_link_channel' }]],
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

    const store = await this.prisma.store.findFirst({ where: { sellerId: seller.id } });
    if (!store) {
      await this.bot.sendMessage(chatId, '⚠️ Магазин не найден.');
      return;
    }

    await this.prisma.store.update({
      where: { id: store.id },
      data: {
        telegramChannelId: channelId,
        telegramChannelTitle: channelTitle ?? channelId,
      },
    });

    await this.bot.sendMessage(
      chatId,
      `✅ Канал <b>${channelTitle ?? channelId}</b> привязан!\n\nТеперь когда вы публикуете товар — бот автоматически постит его в канал с кнопками для заказа.`,
      { parseMode: 'HTML' },
    );

    await this.showSellerMenu(chatId, user.phone);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Автопостинг товара в канал
  // ─────────────────────────────────────────────────────────────────────────

  async postProductToChannel(storeId: string, productId: string): Promise<void> {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store?.telegramChannelId) return;

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) return;

    const price = `${Number(product.basePrice).toLocaleString('ru')} сум`;
    const text = `🛍 <b>${product.title}</b>\n\n${product.description ? `📝 ${product.description}\n\n` : ''}💰 Цена: <b>${price}</b>\n\n🏪 Магазин: ${store.name}`;

    const buyerUrl = process.env.BUYER_APP_URL ?? 'https://savdo.uz';
    const buttons: InlineButton[][] = [
      [{ text: '🛒 Заказать', callback_data: `noop` }],
      [{ text: '💬 Написать продавцу', callback_data: `noop` }],
    ];

    // Для каналов используем inline_keyboard с url кнопками
    await this.bot.sendToChannel(store.telegramChannelId, text, [
      [{ text: '🛒 Заказать товар', url: `${buyerUrl}/${store.slug}/products/${productId}` }],
      [{ text: '💬 Написать продавцу', url: store.telegramContactLink || `${buyerUrl}/${store.slug}` }],
    ]);

    this.logger.log(`Posted product ${productId} to channel ${store.telegramChannelId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Меню продавца
  // ─────────────────────────────────────────────────────────────────────────

  async showSellerMenu(chatId: string, name: string): Promise<void> {
    await this.clearState(chatId);
    await this.bot.sendInlineKeyboard(
      chatId,
      `👋 <b>${name}</b>, вы в панели продавца:`,
      [
        [{ text: '📋 Новые заказы',       callback_data: 'seller_orders'       }],
        [{ text: '🔗 Мой магазин',        callback_data: 'seller_store'        }],
        [{ text: '📊 Статистика',         callback_data: 'seller_stats'        }],
        [{ text: '📢 Настройка канала',   callback_data: 'seller_link_channel' }],
      ],
      'HTML',
    );
  }

  async handleSellerOrders(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    const store  = seller ? await this.prisma.store.findFirst({ where: { sellerId: seller.id } }) : null;
    if (!store) { await this.bot.sendMessage(chatId, '⚠️ Магазин не найден.'); return; }

    const orders = await this.prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (!orders.length) {
      await this.bot.sendMessage(chatId, '📭 Заказов пока нет.');
      return;
    }

    const lines = orders.map((o, i) => {
      const status = ORDER_LABEL[o.status] ?? o.status;
      const amount = o.totalAmount ? `${Number(o.totalAmount).toLocaleString('ru')} сум` : '—';
      return `${i + 1}. #${o.orderNumber ?? o.id.slice(-6)} | ${status}\n   💰 ${amount}`;
    });

    await this.bot.sendMessage(chatId, `<b>📋 Заказы (${orders.length}):</b>\n\n${lines.join('\n\n')}`, { parseMode: 'HTML' });
  }

  async handleSellerStore(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    const store  = seller ? await this.prisma.store.findFirst({ where: { sellerId: seller.id } }) : null;
    if (!store) { await this.bot.sendMessage(chatId, '⚠️ Магазин не найден.'); return; }

    const channel = store.telegramChannelId
      ? `\n📢 Канал: ${store.telegramChannelTitle ?? store.telegramChannelId}`
      : `\n📢 Канал: не привязан`;

    await this.bot.sendMessage(
      chatId,
      `🏪 <b>${store.name}</b>\n🔗 savdo.uz/${store.slug}\n📌 Статус: ${store.status}${channel}`,
      { parseMode: 'HTML' },
    );
  }

  async handleSellerStats(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    const store  = seller ? await this.prisma.store.findFirst({ where: { sellerId: seller.id } }) : null;
    if (!store) { await this.bot.sendMessage(chatId, '⚠️ Магазин не найден.'); return; }

    const [productCount, orderCount] = await Promise.all([
      this.prisma.product.count({ where: { storeId: store.id, deletedAt: null } }),
      this.prisma.order.count({ where: { storeId: store.id } }),
    ]);

    await this.bot.sendMessage(
      chatId,
      `📊 <b>Статистика «${store.name}»</b>\n\n📦 Товаров: <b>${productCount}</b>\n🛒 Всего заказов: <b>${orderCount}</b>`,
      { parseMode: 'HTML' },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Меню покупателя
  // ─────────────────────────────────────────────────────────────────────────

  async showBuyerMenu(chatId: string, name: string): Promise<void> {
    await this.clearState(chatId);
    await this.bot.sendInlineKeyboard(
      chatId,
      `👋 Привет, <b>${name}</b>!`,
      [
        [{ text: '🏪 Найти магазин', callback_data: 'buyer_find_store' }],
        [{ text: '📦 Мои заказы',   callback_data: 'buyer_orders'     }],
      ],
      'HTML',
    );
  }

  async handleBuyerFindStore(chatId: string): Promise<void> {
    await this.setState(chatId, 'awaiting_store_slug');
    await this.bot.sendMessage(chatId, '🔍 Введите адрес магазина:\n\nНапример: <code>my-store</code>', { parseMode: 'HTML' });
  }

  async handleStoreSlugInput(chatId: string, slug: string): Promise<void> {
    await this.clearState(chatId);

    const store = await this.prisma.store.findUnique({ where: { slug: slug.trim().toLowerCase() } });
    if (!store) {
      await this.bot.sendInlineKeyboard(
        chatId,
        `❌ Магазин <code>${slug}</code> не найден.`,
        [[{ text: '🔍 Искать снова', callback_data: 'buyer_find_store' }]],
        'HTML',
      );
      return;
    }

    const products = await this.prisma.product.findMany({
      where: { storeId: store.id, status: 'ACTIVE', deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const productLines = products.length
      ? products.map((p, i) => `${i + 1}. <b>${p.title}</b> — ${Number(p.basePrice).toLocaleString('ru')} сум`).join('\n')
      : '📭 Товаров пока нет';

    const buyerUrl = process.env.BUYER_APP_URL ?? 'https://savdo.uz';
    await this.bot.sendToChannel(chatId, // sendToChannel работает и для личных чатов
      `🏪 <b>${store.name}</b>\n\n${store.description ? `${store.description}\n\n` : ''}<b>Товары:</b>\n${productLines}`,
      [[{ text: '🛒 Открыть магазин', url: `${buyerUrl}/${store.slug}` }]],
      'HTML',
    );
  }

  async handleBuyerOrders(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const buyer = await this.prisma.buyer.findUnique({ where: { userId: user.id } });
    if (!buyer) {
      await this.bot.sendMessage(chatId, '📭 У вас ещё нет заказов. Оформите первый на savdo.uz');
      return;
    }

    const orders = await this.prisma.order.findMany({
      where: { buyerId: buyer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (!orders.length) {
      await this.bot.sendMessage(chatId, '📭 У вас ещё нет заказов.');
      return;
    }

    const lines = orders.map((o, i) => {
      const status = ORDER_LABEL[o.status] ?? o.status;
      const amount = o.totalAmount ? `${Number(o.totalAmount).toLocaleString('ru')} сум` : '—';
      return `${i + 1}. #${o.orderNumber ?? o.id.slice(-6)} | ${status}\n   💰 ${amount}`;
    });

    await this.bot.sendMessage(chatId, `<b>📦 Мои заказы:</b>\n\n${lines.join('\n\n')}`, { parseMode: 'HTML' });
  }
}
