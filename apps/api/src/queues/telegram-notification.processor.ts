import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TelegramBotService } from '../modules/telegram/services/telegram-bot.service';
import { PrismaService } from '../database/prisma.service';
import { QUEUE_TELEGRAM_NOTIFICATIONS } from './queues.module';
import {
  NotifyNewOrderData,
  NotifyStoreApprovedData,
  NotifyStoreRejectedData,
  NotifyVerificationApprovedData,
  NotifyOrderStatusChangedData,
  NotifyChatMessageData,
} from '../modules/telegram/services/seller-notification.service';
import { TELEGRAM_JOB_BROADCAST } from '../modules/admin/use-cases/broadcast.use-case';
import { escapeTgHtml } from '../shared/telegram-html';
import { t, fmt, currency as currencyLabel } from '../shared/i18n';

export const TELEGRAM_JOB_NEW_ORDER = 'new-order';
export const TELEGRAM_JOB_STORE_APPROVED = 'store-approved';
export const TELEGRAM_JOB_STORE_REJECTED = 'store-rejected';
export const TELEGRAM_JOB_VERIFICATION_APPROVED = 'verification-approved';
export const TELEGRAM_JOB_ORDER_STATUS_CHANGED = 'order-status-changed';
export const TELEGRAM_JOB_CHAT_MESSAGE = 'chat-message';
export const TELEGRAM_JOB_CART_ABANDONED = 'cart-abandoned';
export const TELEGRAM_JOB_WISHLIST_PRICE_DROP = 'wishlist-price-drop';
export const TELEGRAM_JOB_WISHLIST_BACK_IN_STOCK = 'wishlist-back-in-stock';

export interface NotifyCartAbandonedData {
  cartId: string;
  recipientChatId: string;
  storeName: string;
  itemCount: number;
  total: number;
  currency: string;
  /** Используется для TMA deep-link `?startapp=cart` (универсальный путь к корзине). */
  cartDeepLink: string;
  /** MARKETING-LOCALIZATION-UZ-001: User.languageCode для локализации шаблона. */
  locale?: string;
}

export interface NotifyWishlistData {
  wishlistItemId: string;
  recipientChatId: string;
  productTitle: string;
  storeName: string;
  storeSlug: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  /** Deep-link на ProductPage в TMA. */
  productDeepLink: string;
  /** MARKETING-LOCALIZATION-UZ-001: User.languageCode для локализации шаблона. */
  locale?: string;
}

// MARKETING-LOCALIZATION-UZ-001: order status labels теперь в `shared/i18n.ts`
// через ключи `orders.status.{STATUS}.{role}`. См. `t()` ниже.

@Processor(QUEUE_TELEGRAM_NOTIFICATIONS)
export class TelegramNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramNotificationProcessor.name);

  constructor(
    private readonly telegramBot: TelegramBotService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    try {
      switch (job.name) {
        case TELEGRAM_JOB_NEW_ORDER: {
          const d = job.data as NotifyNewOrderData;
          const loc = d.locale;
          const text =
            t(loc, 'notify.newOrder.title', { orderNumber: d.orderNumber }) + '\n' +
            t(loc, 'notify.newOrder.body', {
              storeName: d.storeName,
              itemCount: d.itemCount,
              total: fmt(d.total, loc),
              currency: currencyLabel(d.currency, loc),
            });
          await this.telegramBot.sendMessage(`@${d.sellerTelegramUsername}`, text);
          break;
        }

        case TELEGRAM_JOB_STORE_APPROVED: {
          const d = job.data as NotifyStoreApprovedData;
          await this.telegramBot.sendMessage(
            `@${d.sellerTelegramUsername}`,
            t(d.locale, 'notify.storeApproved', { storeName: d.storeName }),
          );
          break;
        }

        case TELEGRAM_JOB_STORE_REJECTED: {
          const d = job.data as NotifyStoreRejectedData;
          const reasonLine = d.reason
            ? '\n' + t(d.locale, 'notify.storeRejected.reason', { reason: d.reason })
            : '';
          await this.telegramBot.sendMessage(
            `@${d.sellerTelegramUsername}`,
            t(d.locale, 'notify.storeRejected.title', { storeName: d.storeName }) + reasonLine,
          );
          break;
        }

        case TELEGRAM_JOB_VERIFICATION_APPROVED: {
          const d = job.data as NotifyVerificationApprovedData;
          await this.telegramBot.sendMessage(
            `@${d.sellerTelegramUsername}`,
            t(d.locale, 'notify.verificationApproved'),
          );
          break;
        }

        case TELEGRAM_JOB_ORDER_STATUS_CHANGED: {
          const d = job.data as NotifyOrderStatusChangedData;
          const loc = d.locale;
          const role = d.recipientRole === 'BUYER' ? 'buyer' : 'seller';
          const statusText = t(loc, `orders.status.${d.newStatus}.${role}`);
          const templateKey = d.recipientRole === 'BUYER'
            ? 'notify.orderStatus.buyer'
            : 'notify.orderStatus.seller';
          const text = t(loc, templateKey, {
            orderNumber: d.orderNumber,
            status: statusText,
            storeName: d.storeName,
            total: fmt(d.total, loc),
            currency: currencyLabel(d.currency, loc),
          });
          await this.telegramBot.sendMessage(d.recipientChatId, text);
          break;
        }

        case TELEGRAM_JOB_CHAT_MESSAGE: {
          // Polat 07.05: формат как нормальный мессенджер — bold заголовок,
          // понятный context, кнопка «Открыть чат» one-tap в TMA.
          const d = job.data as NotifyChatMessageData;
          const loc = d.locale;

          const storeMeta =
            d.recipientRole === 'BUYER' && d.storeName && d.storeName !== d.senderName
              ? ` · ${escapeTgHtml(d.storeName)}`
              : '';
          const senderLineKey = d.recipientRole === 'SELLER'
            ? 'notify.chat.fromSeller'
            : 'notify.chat.fromBuyer';
          const senderLine = t(loc, senderLineKey, {
            senderName: escapeTgHtml(d.senderName),
            storeMeta,
          });

          const contextLine = d.productTitle
            ? t(loc, 'notify.chat.context.product', { productTitle: escapeTgHtml(d.productTitle) })
            : d.orderNumber
              ? t(loc, 'notify.chat.context.order', { orderNumber: escapeTgHtml(d.orderNumber.replace(/^ORD-/, '')) })
              : '';

          const text =
            t(loc, 'notify.chat.title') + '\n' +
            senderLine +
            contextLine + '\n\n' +
            `«${escapeTgHtml(d.messagePreview)}»`;

          // Кнопка-ссылка «Открыть чат» — глубокий линк через TMA startapp.
          const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'savdo_builderBOT';
          const startapp = `chat_${d.threadId}`;

          await this.telegramBot.sendMessage(d.recipientChatId, text, {
            parseMode: 'HTML',
            replyMarkup: {
              inline_keyboard: [[
                { text: t(loc, 'notify.chat.openButton'), url: `https://t.me/${botUsername}?startapp=${startapp}` },
              ]],
            },
          });
          break;
        }

        case TELEGRAM_JOB_CART_ABANDONED: {
          // MARKETING-CART-ABANDONMENT-001 — мягкий ремаркетинг через TG.
          // Один nudge на cart, cron уже выставил nudgeSentAt+nudgeCount в БД
          // до постановки job'а (idempotent — даже если job retry, не дублирует).
          const d = job.data as NotifyCartAbandonedData;
          const loc = d.locale;
          const text =
            t(loc, 'notify.cartAbandoned.title') + '\n' +
            t(loc, 'notify.cartAbandoned.body', {
              storeName: escapeTgHtml(d.storeName),
              itemCount: d.itemCount,
              total: fmt(d.total, loc),
              currency: currencyLabel(d.currency, loc),
            }) + '\n\n' +
            t(loc, 'notify.cartAbandoned.cta');

          await this.telegramBot.sendMessage(d.recipientChatId, text, {
            parseMode: 'HTML',
            replyMarkup: {
              inline_keyboard: [[
                { text: t(loc, 'notify.cartAbandoned.button'), url: d.cartDeepLink },
              ]],
            },
          });
          break;
        }

        case TELEGRAM_JOB_WISHLIST_PRICE_DROP: {
          // MARKETING-WISHLIST-NOTIFY-001 — товар из избранного подешевел.
          // Cron уже выставил notifiedAt+reason в БД до постановки job'а.
          const d = job.data as NotifyWishlistData;
          const loc = d.locale;
          const discountPct = d.oldPrice > 0
            ? Math.round(((d.oldPrice - d.newPrice) / d.oldPrice) * 100)
            : 0;
          const text =
            t(loc, 'notify.priceDrop.title', { discountPct }) + '\n' +
            t(loc, 'notify.priceDrop.body', {
              productTitle: escapeTgHtml(d.productTitle),
              storeName: escapeTgHtml(d.storeName),
              oldPrice: fmt(d.oldPrice, loc),
              newPrice: fmt(d.newPrice, loc),
              currency: currencyLabel(d.currency, loc),
            });

          await this.telegramBot.sendMessage(d.recipientChatId, text, {
            parseMode: 'HTML',
            replyMarkup: {
              inline_keyboard: [[
                { text: t(loc, 'notify.wishlist.openButton'), url: d.productDeepLink },
              ]],
            },
          });
          break;
        }

        case TELEGRAM_JOB_WISHLIST_BACK_IN_STOCK: {
          // MARKETING-WISHLIST-NOTIFY-001 — товар снова доступен.
          const d = job.data as NotifyWishlistData;
          const loc = d.locale;
          const text =
            t(loc, 'notify.backInStock.title') + '\n' +
            t(loc, 'notify.backInStock.body', {
              productTitle: escapeTgHtml(d.productTitle),
              storeName: escapeTgHtml(d.storeName),
              newPrice: fmt(d.newPrice, loc),
              currency: currencyLabel(d.currency, loc),
            });

          await this.telegramBot.sendMessage(d.recipientChatId, text, {
            parseMode: 'HTML',
            replyMarkup: {
              inline_keyboard: [[
                { text: t(loc, 'notify.wishlist.openButton'), url: d.productDeepLink },
              ]],
            },
          });
          break;
        }

        case TELEGRAM_JOB_BROADCAST: {
          const d = job.data as { chatId: string; message: string; broadcastLogId: string };
          // sendMessage catches errors internally and returns null on failure.
          // Try HTML first, fall back to plain text if Telegram rejects HTML markup.
          let msgId = await this.telegramBot.sendMessage(d.chatId, d.message, { parseMode: 'HTML' });
          if (msgId === null) {
            msgId = await this.telegramBot.sendMessage(d.chatId, d.message);
          }
          await this.prisma.broadcastLog.update({
            where: { id: d.broadcastLogId },
            data: msgId !== null
              ? { sentCount: { increment: 1 } }
              : { failedCount: { increment: 1 } },
          });
          break;
        }

        default:
          this.logger.error(
            `TelegramNotificationProcessor: unknown job name "${job.name}" (id=${job.id})`,
          );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `TelegramNotificationProcessor failed [job=${job.name} id=${job.id}]: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
}
