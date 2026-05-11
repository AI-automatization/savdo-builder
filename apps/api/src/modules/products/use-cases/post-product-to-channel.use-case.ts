import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * FEAT-TG-AUTOPOST-001: пост товара в Telegram-канал продавца.
 *
 * Триггеры:
 *   1. Авто: при `changeProductStatus → ACTIVE` если `store.autoPostProductsToChannel=true`
 *      и `store.telegramChannelId` не пустой.
 *   2. Manual: POST `/seller/products/:id/repost-to-channel` (override авто-флаг
 *      для re-post после правки).
 *
 * Поведение:
 *   - 1 фото → sendPhotoToChannel с inline-button «Открыть товар»
 *   - 2-10 фото → sendMediaGroupToChannel (caption на первом)
 *   - 0 фото → sendToChannel (text-only с button)
 *
 * Никогда не бросает в caller — это side-effect, fail-tolerant. Лог + return.
 */

export interface PostInput {
  productId: string;
  /** Force-post игнорируя `autoPostProductsToChannel` (manual trigger). */
  force?: boolean;
}

export interface PostResult {
  posted: boolean;
  reason?: string;
}

@Injectable()
export class PostProductToChannelUseCase {
  private readonly logger = new Logger(PostProductToChannelUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBot: TelegramBotService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: PostInput): Promise<PostResult> {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      include: {
        store: true,
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 10,
          include: { media: { select: { id: true, objectKey: true, bucket: true } } },
        },
      },
    });

    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }

    const store = product.store;
    if (!store) {
      return { posted: false, reason: 'Store not found' };
    }
    if (!store.telegramChannelId) {
      return { posted: false, reason: 'Channel not configured' };
    }
    if (!input.force && !store.autoPostProductsToChannel) {
      return { posted: false, reason: 'Auto-post disabled' };
    }

    const buyerBaseUrl = (this.config.get<string>('app.buyerUrl') ?? process.env.BUYER_URL ?? '').replace(/\/$/, '');
    const productUrl = buyerBaseUrl
      ? `${buyerBaseUrl}/${store.slug}/products/${product.id}`
      : `https://t.me/${this.config.get<string>('telegram.botUsername') ?? 'savdo_builderBOT'}?startapp=product_${product.id}`;

    const caption = this.buildCaption(product as any, store as any, productUrl);

    // bucket='telegram' → objectKey хранит TG file_id
    // (см. telegram-storage.service.ts uploadFile). bucket='telegram-expired'
    // означает мёртвый file_id — пропускаем чтобы не упасть на sendPhoto 400.
    const tgFileIds = product.images
      .map((i) => i.media)
      .filter((m): m is NonNullable<typeof m> => Boolean(m && m.bucket === 'telegram' && m.objectKey))
      .map((m) => m.objectKey);

    const buttons = [[{ text: '🛒 Открыть товар', url: productUrl }]];

    try {
      if (tgFileIds.length === 0) {
        await this.telegramBot.sendToChannel(store.telegramChannelId, caption, buttons, 'HTML');
      } else if (tgFileIds.length === 1) {
        await this.telegramBot.sendPhotoToChannel(store.telegramChannelId, tgFileIds[0], caption, buttons, 'HTML');
      } else {
        // Media group — Telegram не поддерживает inline-buttons на group,
        // поэтому ссылка будет в caption + отдельный follow-up message не нужен.
        await this.telegramBot.sendMediaGroupToChannel(store.telegramChannelId, tgFileIds, caption, 'HTML');
      }
      this.logger.log(`Posted product ${product.id} to channel ${store.telegramChannelId} (${tgFileIds.length} photos)`);
      return { posted: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to post product ${product.id}: ${msg}`);
      return { posted: false, reason: msg };
    }
  }

  /**
   * Безопасный HTML escape для product.title / description (Telegram parse_mode=HTML).
   * Telegram allowed: <b>, <i>, <u>, <s>, <a>, <code>, <pre>. Всё остальное — escape.
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private formatPrice(amount: unknown, currency: string): string {
    const n = Number(String(amount));
    if (Number.isNaN(n)) return '—';
    return `${n.toLocaleString('ru-RU')} ${currency}`;
  }

  private buildCaption(
    product: { title: string; description: string | null; basePrice: unknown; salePrice: unknown; oldPrice: unknown; currencyCode: string },
    store: { name: string },
    url: string,
  ): string {
    const lines: string[] = [];
    lines.push(`<b>${this.escapeHtml(product.title)}</b>`);
    lines.push('');

    if (product.salePrice != null) {
      lines.push(`💰 <b>${this.formatPrice(product.salePrice, product.currencyCode)}</b>  <s>${this.formatPrice(product.basePrice, product.currencyCode)}</s>`);
    } else if (product.oldPrice != null) {
      lines.push(`💰 <b>${this.formatPrice(product.basePrice, product.currencyCode)}</b>  <s>${this.formatPrice(product.oldPrice, product.currencyCode)}</s>`);
    } else {
      lines.push(`💰 <b>${this.formatPrice(product.basePrice, product.currencyCode)}</b>`);
    }

    if (product.description) {
      // Обрезаем до 700 символов — caption Telegram limit ~1024.
      const desc = product.description.length > 700
        ? product.description.slice(0, 697) + '...'
        : product.description;
      lines.push('');
      lines.push(this.escapeHtml(desc));
    }

    lines.push('');
    lines.push(`🏪 ${this.escapeHtml(store.name)}`);
    lines.push(`<a href="${url}">Открыть товар →</a>`);

    return lines.join('\n');
  }
}
