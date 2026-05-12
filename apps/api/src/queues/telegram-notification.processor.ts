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

export const TELEGRAM_JOB_NEW_ORDER = 'new-order';
export const TELEGRAM_JOB_STORE_APPROVED = 'store-approved';
export const TELEGRAM_JOB_STORE_REJECTED = 'store-rejected';
export const TELEGRAM_JOB_VERIFICATION_APPROVED = 'verification-approved';
export const TELEGRAM_JOB_ORDER_STATUS_CHANGED = 'order-status-changed';
export const TELEGRAM_JOB_CHAT_MESSAGE = 'chat-message';
export const TELEGRAM_JOB_CART_ABANDONED = 'cart-abandoned';

export interface NotifyCartAbandonedData {
  cartId: string;
  recipientChatId: string;
  storeName: string;
  itemCount: number;
  total: number;
  currency: string;
  /** Используется для TMA deep-link `?startapp=cart` (универсальный путь к корзине). */
  cartDeepLink: string;
}

const ORDER_STATUS_LABEL_BUYER: Record<string, string> = {
  PENDING:    '⏳ ожидает подтверждения',
  CONFIRMED:  '✅ подтверждён продавцом',
  PROCESSING: '📦 готовится к отправке',
  SHIPPED:    '🚚 отправлен',
  DELIVERED:  '🎉 доставлен',
  CANCELLED:  '❌ отменён',
};

const ORDER_STATUS_LABEL_SELLER: Record<string, string> = {
  PENDING:    '⏳ ожидает подтверждения',
  CONFIRMED:  '✅ подтверждён',
  PROCESSING: '📦 в обработке',
  SHIPPED:    '🚚 отправлен',
  DELIVERED:  '🎉 доставлен',
  CANCELLED:  '❌ отменён покупателем',
};

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
          const text =
            `📦 Новый заказ #${d.orderNumber}\n` +
            `Магазин: ${d.storeName}\n` +
            `Товаров: ${d.itemCount}\n` +
            `Сумма: ${d.total} ${d.currency}`;
          await this.telegramBot.sendMessage(`@${d.sellerTelegramUsername}`, text);
          break;
        }

        case TELEGRAM_JOB_STORE_APPROVED: {
          const d = job.data as NotifyStoreApprovedData;
          await this.telegramBot.sendMessage(
            `@${d.sellerTelegramUsername}`,
            `✅ Ваш магазин «${d.storeName}» одобрен и теперь доступен покупателям!`,
          );
          break;
        }

        case TELEGRAM_JOB_STORE_REJECTED: {
          const d = job.data as NotifyStoreRejectedData;
          const reasonLine = d.reason ? `\nПричина: ${d.reason}` : '';
          await this.telegramBot.sendMessage(
            `@${d.sellerTelegramUsername}`,
            `❌ Ваш магазин «${d.storeName}» отклонён.${reasonLine}`,
          );
          break;
        }

        case TELEGRAM_JOB_VERIFICATION_APPROVED: {
          const d = job.data as NotifyVerificationApprovedData;
          await this.telegramBot.sendMessage(
            `@${d.sellerTelegramUsername}`,
            '✅ Ваш аккаунт продавца верифицирован. Теперь вы можете создать магазин.',
          );
          break;
        }

        case TELEGRAM_JOB_ORDER_STATUS_CHANGED: {
          const d = job.data as NotifyOrderStatusChangedData;
          const labelMap = d.recipientRole === 'BUYER' ? ORDER_STATUS_LABEL_BUYER : ORDER_STATUS_LABEL_SELLER;
          const statusText = labelMap[d.newStatus] ?? d.newStatus;
          const intro = d.recipientRole === 'BUYER'
            ? `🛒 Ваш заказ #${d.orderNumber}`
            : `📦 Заказ #${d.orderNumber}`;
          const text =
            `${intro} — ${statusText}\n` +
            `Магазин: ${d.storeName}\n` +
            `Сумма: ${d.total.toLocaleString('ru')} ${d.currency}`;
          await this.telegramBot.sendMessage(d.recipientChatId, text);
          break;
        }

        case TELEGRAM_JOB_CHAT_MESSAGE: {
          // Polat 07.05: формат как нормальный мессенджер — bold заголовок,
          // понятный context, кнопка «Открыть чат» one-tap в TMA.
          const d = job.data as NotifyChatMessageData;

          const senderLine = d.recipientRole === 'SELLER'
            ? `от <b>${escapeTgHtml(d.senderName)}</b>` // продавцу: «от +99890...»
            : `от <b>${escapeTgHtml(d.senderName)}</b>${d.storeName && d.storeName !== d.senderName ? ` · ${escapeTgHtml(d.storeName)}` : ''}`; // покупателю: «от Магазин»

          const contextLine = d.productTitle
            ? `\n📦 <i>${escapeTgHtml(d.productTitle)}</i>`
            : d.orderNumber
              ? `\n🧾 <i>Заказ #${escapeTgHtml(d.orderNumber.replace(/^ORD-/, ''))}</i>`
              : '';

          const text =
            `💬 <b>Новое сообщение</b>\n` +
            `${senderLine}` +
            `${contextLine}\n\n` +
            `«${escapeTgHtml(d.messagePreview)}»`;

          // Кнопка-ссылка «Открыть чат» — глубокий линк через TMA startapp.
          // Telegram при клике откроет наш Mini App с параметром chat_<threadId>.
          const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'savdo_builderBOT';
          const startapp = `chat_${d.threadId}`;

          await this.telegramBot.sendMessage(d.recipientChatId, text, {
            parseMode: 'HTML',
            replyMarkup: {
              inline_keyboard: [[
                { text: '✉️ Открыть чат', url: `https://t.me/${botUsername}?startapp=${startapp}` },
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
          const text =
            `🛒 <b>Вы оставили товары в корзине</b>\n` +
            `Магазин: ${escapeTgHtml(d.storeName)}\n` +
            `Товаров: ${d.itemCount}\n` +
            `Сумма: ${d.total.toLocaleString('ru')} ${d.currency}\n\n` +
            `Завершите заказ за 30 секунд — товары всё ещё в наличии.`;

          await this.telegramBot.sendMessage(d.recipientChatId, text, {
            parseMode: 'HTML',
            replyMarkup: {
              inline_keyboard: [[
                { text: '🛍 Открыть корзину', url: d.cartDeepLink },
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
