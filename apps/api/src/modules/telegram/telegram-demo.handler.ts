import { Injectable, Logger } from '@nestjs/common';
import { TelegramBotService, InlineButton } from './services/telegram-bot.service';
import { RedisService } from '../../shared/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { SellersRepository } from '../sellers/repositories/sellers.repository';
import { StoresRepository } from '../stores/repositories/stores.repository';
import { ProductsRepository } from '../products/repositories/products.repository';
import { OrdersRepository } from '../orders/repositories/orders.repository';

const STATE_TTL = 300; // 5 минут
const STATE_KEY = (chatId: string) => `tg:state:${chatId}`;
const PHONE_KEY = (chatId: string) => `tg:phone:${chatId}`;

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING:    '🟡 Ожидает',
  CONFIRMED:  '🔵 Подтверждён',
  SHIPPED:    '🚚 Доставляется',
  DELIVERED:  '✅ Доставлен',
  CANCELLED:  '❌ Отменён',
};

@Injectable()
export class TelegramDemoHandler {
  private readonly logger = new Logger(TelegramDemoHandler.name);

  constructor(
    private readonly bot: TelegramBotService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly users: UsersRepository,
    private readonly sellers: SellersRepository,
    private readonly stores: StoresRepository,
    private readonly products: ProductsRepository,
    private readonly orders: OrdersRepository,
  ) {}

  // ── State helpers ─────────────────────────────────────────────────────────

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
    return this.users.findByPhone(phone);
  }

  private async resolveSeller(userId: string) {
    return this.sellers.findByUserId(userId);
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

    const seller = await this.resolveSeller(user.id);
    if (seller) {
      await this.showSellerMenu(chatId, firstName ?? user.phone);
    } else {
      await this.showBuyerMenu(chatId, firstName ?? user.phone);
    }
  }

  // ── Seller menu ───────────────────────────────────────────────────────────

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

    const seller = await this.resolveSeller(user.id);
    if (!seller) { await this.handleStart(chatId); return; }

    const store = await this.stores.findBySellerId(seller.id);
    if (!store) {
      await this.bot.sendMessage(chatId, '⚠️ У вас ещё нет магазина.');
      return;
    }

    const { orders } = await this.orders.findByStoreId(store.id, { limit: 5 });

    if (!orders.length) {
      await this.bot.sendMessage(chatId, '📭 Новых заказов нет.', { parseMode: 'HTML' });
      return;
    }

    const lines = orders.map((o: { status: string; orderNumber?: string | null; id: string; totalAmount?: unknown }, i: number) => {
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

    const seller = await this.resolveSeller(user.id);
    if (!seller) { await this.handleStart(chatId); return; }

    const store = await this.stores.findBySellerId(seller.id);
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

    const seller = await this.resolveSeller(user.id);
    if (!seller) { await this.handleStart(chatId); return; }

    const store = await this.stores.findBySellerId(seller.id);
    if (!store) {
      await this.bot.sendMessage(chatId, '⚠️ У вас ещё нет магазина.');
      return;
    }

    const [productCount, { total }] = await Promise.all([
      this.products.countByStoreId(store.id),
      this.orders.findByStoreId(store.id, { limit: 1 }),
    ]);

    await this.bot.sendMessage(
      chatId,
      `📊 <b>Статистика магазина «${store.name}»</b>\n\n📦 Товаров: <b>${productCount}</b>\n🛒 Всего заказов: <b>${total}</b>`,
      { parseMode: 'HTML' },
    );
  }

  // ── Buyer menu ────────────────────────────────────────────────────────────

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

    const store = await this.stores.findBySlug(slug.trim().toLowerCase());
    if (!store) {
      await this.bot.sendInlineKeyboard(
        chatId,
        `❌ Магазин <code>${slug}</code> не найден.\n\nПроверьте адрес и попробуйте снова.`,
        [[{ text: '🔍 Искать снова', callback_data: 'buyer_find_store' }]],
        'HTML',
      );
      return;
    }

    const allProducts = await this.products.findPublicByStoreId(store.id);
    const productList = allProducts.slice(0, 5);

    const productLines = productList.length
      ? productList.map((p, i) => {
          const price = p.basePrice ? `${Number(p.basePrice).toLocaleString('ru')} сум` : '—';
          return `${i + 1}. <b>${p.title}</b> — ${price}`;
        }).join('\n')
      : '📭 Товаров пока нет';

    await this.bot.sendInlineKeyboard(
      chatId,
      `🏪 <b>${store.name}</b>\n\n${store.description ? `📝 ${store.description}\n\n` : ''}🔗 savdo.uz/${store.slug}\n\n<b>Топ товаров:</b>\n${productLines}`,
      [[{ text: '🛒 Открыть магазин', callback_data: `open_store_${store.slug}` }]],
      'HTML',
    );
  }

  async handleBuyerOrders(chatId: string): Promise<void> {
    const user = await this.resolveUser(chatId);
    if (!user) { await this.handleStart(chatId); return; }

    // Buyer record is separate from User — find by userId
    const buyer = await this.prisma.buyer.findUnique({ where: { userId: user.id } });
    if (!buyer) {
      await this.bot.sendMessage(chatId, '⚠️ Профиль покупателя не найден. Сначала оформите заказ на savdo.uz');
      return;
    }

    const { orders } = await this.orders.findByBuyerId(buyer.id, { limit: 5 });

    if (!orders.length) {
      await this.bot.sendMessage(chatId, '📭 У вас ещё нет заказов.');
      return;
    }

    const lines = orders.map((o: { status: string; orderNumber?: string | null; id: string; totalAmount?: unknown }, i: number) => {
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
