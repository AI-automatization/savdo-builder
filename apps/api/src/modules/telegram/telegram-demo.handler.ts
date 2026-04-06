import { Injectable, Logger } from '@nestjs/common';
import { TelegramBotService, InlineButton } from './services/telegram-bot.service';
import { RedisService } from '../../shared/redis.service';
import { PrismaService } from '../../database/prisma.service';

const STATE_TTL = 300;
const STATE_KEY = (chatId: string) => `tg:state:${chatId}`;
const PHONE_KEY = (chatId: string) => `tg:phone:${chatId}`;

const ORDER_STATUS_LABEL: Record<string, string> = {
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

  // ── State ─────────────────────────────────────────────────────────────────

  async getState(chatId: string): Promise<string | null> {
    return this.redis.get(STATE_KEY(chatId));
  }

  async setState(chatId: string, state: string): Promise<void> {
    await this.redis.set(STATE_KEY(chatId), state, STATE_TTL);
  }

  async clearState(chatId: string): Promise<void> {
    await this.redis.del(STATE_KEY(chatId));
  }

  async getPhone(chatId: string): Promise<string | null> {
    return this.redis.get(PHONE_KEY(chatId));
  }

  // ── User resolution ───────────────────────────────────────────────────────

  private async resolveUser(chatId: string) {
    const phone = await this.getPhone(chatId);
    if (!phone) return null;
    return this.prisma.user.findUnique({ where: { phone } });
  }

  // ── /start ────────────────────────────────────────────────────────────────

  async handleStart(chatId: string, firstName?: string): Promise<void> {
    const user = await this.resolveUser(chatId);

    if (!user) {
      await this.bot.sendMessage(
        chatId,
        `👋 Привет${firstName ? `, ${firstName}` : ''}!\n\nЯ бот магазина <b>Savdo</b>.\nПоделитесь номером телефона, чтобы войти в аккаунт.`,
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

  // ── Seller ────────────────────────────────────────────────────────────────

  async showSellerMenu(chatId: string, name: string): Promise<void> {
    await this.clearState(chatId);
    const buttons: InlineButton[][] = [
      [{ text: '📋 Новые заказы', callback_data: 'seller_orders' }],
      [{ text: '🔗 Мой магазин',  callback_data: 'seller_store'  }],
      [{ text: '📊 Статистика',   callback_data: 'seller_stats'  }],
    ];
    await this.bot.sendInlineKeyboard(
      chatId,
      `✅ Добро пожаловать, <b>${name}</b>!\n\nВы вошли как <b>продавец</b>. Выберите действие:`,
      buttons,
      'HTML',
    );
  }

  async handleSellerOrders(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) { await this.handleStart(chatId); return; }

    const store = await this.prisma.store.findFirst({ where: { sellerId: seller.id } });
    if (!store) {
      await this.bot.sendMessage(chatId, '⚠️ У вас ещё нет магазина.');
      return;
    }

    const orders = await this.prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (!orders.length) {
      await this.bot.sendMessage(chatId, '📭 Заказов пока нет.', { parseMode: 'HTML' });
      return;
    }

    const lines = orders.map((o, i) => {
      const status = ORDER_STATUS_LABEL[o.status] ?? o.status;
      const amount = o.totalAmount ? `${Number(o.totalAmount).toLocaleString('ru')} сум` : '—';
      return `${i + 1}. #${o.orderNumber ?? o.id.slice(-6)} | ${status}\n   💰 ${amount}`;
    });

    await this.bot.sendMessage(
      chatId,
      `<b>📋 Последние заказы (${orders.length}):</b>\n\n${lines.join('\n\n')}`,
      { parseMode: 'HTML' },
    );
  }

  async handleSellerStore(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) { await this.handleStart(chatId); return; }

    const store = await this.prisma.store.findFirst({ where: { sellerId: seller.id } });
    if (!store) {
      await this.bot.sendMessage(chatId, '⚠️ У вас ещё нет магазина. Создайте его на savdo.uz');
      return;
    }

    await this.bot.sendMessage(
      chatId,
      `🏪 <b>${store.name}</b>\n\n🔗 Ссылка: <code>savdo.uz/${store.slug}</code>\n📌 Статус: ${store.status}`,
      { parseMode: 'HTML' },
    );
  }

  async handleSellerStats(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) { await this.handleStart(chatId); return; }

    const store = await this.prisma.store.findFirst({ where: { sellerId: seller.id } });
    if (!store) {
      await this.bot.sendMessage(chatId, '⚠️ У вас ещё нет магазина.');
      return;
    }

    const [productCount, orderCount] = await Promise.all([
      this.prisma.product.count({ where: { storeId: store.id, deletedAt: null } }),
      this.prisma.order.count({ where: { storeId: store.id } }),
    ]);

    await this.bot.sendMessage(
      chatId,
      `📊 <b>Статистика магазина «${store.name}»</b>\n\n📦 Товаров: <b>${productCount}</b>\n🛒 Всего заказов: <b>${orderCount}</b>`,
      { parseMode: 'HTML' },
    );
  }

  // ── Buyer ─────────────────────────────────────────────────────────────────

  async showBuyerMenu(chatId: string, name: string): Promise<void> {
    await this.clearState(chatId);
    const buttons: InlineButton[][] = [
      [{ text: '🏪 Найти магазин', callback_data: 'buyer_find_store' }],
      [{ text: '📦 Мои заказы',   callback_data: 'buyer_orders'     }],
    ];
    await this.bot.sendInlineKeyboard(
      chatId,
      `✅ Привет, <b>${name}</b>!\n\nВыберите действие:`,
      buttons,
      'HTML',
    );
  }

  async handleBuyerFindStore(chatId: string): Promise<void> {
    await this.setState(chatId, 'awaiting_store_slug');
    await this.bot.sendMessage(chatId, '🔍 Введите адрес магазина:\n\nНапример: <code>my-store</code>', {
      parseMode: 'HTML',
    });
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
      ? products.map((p, i) => {
          const price = `${Number(p.basePrice).toLocaleString('ru')} сум`;
          return `${i + 1}. <b>${p.title}</b> — ${price}`;
        }).join('\n')
      : '📭 Товаров пока нет';

    await this.bot.sendInlineKeyboard(
      chatId,
      `🏪 <b>${store.name}</b>\n\n${store.description ? `📝 ${store.description}\n\n` : ''}🔗 savdo.uz/${store.slug}\n\n<b>Товары:</b>\n${productLines}`,
      [[{ text: '🛒 Открыть магазин', callback_data: `open_store_${store.slug}` }]],
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
      const status = ORDER_STATUS_LABEL[o.status] ?? o.status;
      const amount = o.totalAmount ? `${Number(o.totalAmount).toLocaleString('ru')} сум` : '—';
      return `${i + 1}. #${o.orderNumber ?? o.id.slice(-6)} | ${status}\n   💰 ${amount}`;
    });

    await this.bot.sendMessage(
      chatId,
      `<b>📦 Мои заказы (${orders.length}):</b>\n\n${lines.join('\n\n')}`,
      { parseMode: 'HTML' },
    );
  }
}
