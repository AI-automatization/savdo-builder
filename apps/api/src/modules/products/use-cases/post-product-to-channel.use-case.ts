import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChannelTemplateService, TemplateVariables } from '../services/channel-template.service';
import { ChannelMediaResolverService } from '../services/channel-media-resolver.service';

// Typed include — TypeScript подхватит store/images/attributes/variants из результата findUnique.
const POST_PRODUCT_INCLUDE = Prisma.validator<Prisma.ProductInclude>()({
  store: true,
  images: {
    orderBy: { sortOrder: 'asc' },
    take: 10,
    include: {
      media: { select: { id: true, objectKey: true, bucket: true, photoFileId: true } },
    },
  },
  attributes: { select: { name: true, value: true } },
  variants: { select: { sku: true, titleOverride: true } },
});

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof POST_PRODUCT_INCLUDE }>;

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
 *   - 1 фото  → sendPhoto (открытое изображение) с inline-button «Открыть товар»
 *   - 2-10    → sendMediaGroup (caption на первом)
 *   - 0 фото  → sendMessage (text-only с button)
 *
 * Side effect, fail-tolerant: ошибки не пробрасываются caller'у, лог + return.
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
    private readonly templateService: ChannelTemplateService,
    private readonly mediaResolver: ChannelMediaResolverService,
  ) {}

  async execute(input: PostInput): Promise<PostResult> {
    const product: ProductWithRelations | null = await this.prisma.product.findUnique({
      where: { id: input.productId },
      include: POST_PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }

    const store = product.store;
    if (!store) return { posted: false, reason: 'Store not found' };
    if (!store.telegramChannelId) return { posted: false, reason: 'Channel not configured' };
    if (!input.force && !store.autoPostProductsToChannel) {
      return { posted: false, reason: 'Auto-post disabled' };
    }

    const productUrl = this.buildProductUrl(store.slug, product.id);
    const vars = this.buildTemplateVariables(product, store, productUrl);
    const caption = this.templateService.render(store.channelPostTemplate, vars);

    const photos = await this.resolvePhotos(product.images);
    const buttons = [[{ text: '🛒 Открыть товар', url: productUrl }]];

    try {
      if (photos.length === 0) {
        await this.telegramBot.sendToChannel(store.telegramChannelId, caption, buttons, 'HTML');
      } else if (photos.length === 1) {
        const fileId = await this.telegramBot.sendPhotoToChannel(
          store.telegramChannelId, photos[0].src, caption, buttons, 'HTML',
        );
        if (fileId) await this.mediaResolver.cachePhotoFileId(photos[0].mediaId, fileId);
      } else {
        const fileIds = await this.telegramBot.sendMediaGroupToChannel(
          store.telegramChannelId, photos.map((p) => p.src), caption, 'HTML',
        );
        if (fileIds) {
          await Promise.all(
            fileIds.map((fid, i) =>
              photos[i] ? this.mediaResolver.cachePhotoFileId(photos[i].mediaId, fid) : null,
            ),
          );
        }
      }
      this.logger.log(`Posted product ${product.id} to channel ${store.telegramChannelId} (${photos.length} photos)`);
      return { posted: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to post product ${product.id}: ${msg}`);
      return { posted: false, reason: msg };
    }
  }

  private async resolvePhotos(
    images: Array<{ media: { id: string; objectKey: string; bucket: string; photoFileId: string | null } | null }>,
  ): Promise<Array<{ mediaId: string; src: string }>> {
    const resolved = await Promise.all(
      images.map(async (img) => {
        if (!img.media) return null;
        const src = await this.mediaResolver.resolveForChannelSend(img.media);
        return src ? { mediaId: img.media.id, src } : null;
      }),
    );
    return resolved.filter((r): r is { mediaId: string; src: string } => r !== null);
  }

  private buildProductUrl(storeSlug: string, productId: string): string {
    const buyerBaseUrl = (this.config.get<string>('app.buyerUrl') ?? process.env.BUYER_URL ?? '').replace(/\/$/, '');
    if (buyerBaseUrl) return `${buyerBaseUrl}/${storeSlug}/products/${productId}`;
    const botUsername = this.config.get<string>('telegram.botUsername') ?? 'savdo_builderBOT';
    return `https://t.me/${botUsername}?startapp=product_${productId}`;
  }

  private buildTemplateVariables(
    product: ProductForPost,
    store: StoreForPost,
    productUrl: string,
  ): TemplateVariables {
    const currency = product.currencyCode ?? 'UZS';
    const price = this.formatPrice(product.salePrice ?? product.basePrice, currency);
    const hasOldPrice = product.salePrice != null || product.oldPrice != null;
    const oldPrice = hasOldPrice
      ? this.formatPrice(product.salePrice != null ? product.basePrice : product.oldPrice, currency)
      : '';

    return {
      title: product.title,
      price,
      oldPrice,
      hasOldPrice,
      description: product.description ?? '',
      material: this.extractAttribute(product.attributes, ['material', 'материал', 'matn']),
      sizes: this.extractSizes(product.variants, product.attributes),
      availability: product.totalStock > 0 ? 'В наличии' : 'Под заказ',
      deliveryDays: '', // зарезервировано — пока берём из шаблона
      contact: this.buildContact(store),
      instagram: store.channelInstagramLink ?? '',
      tiktok: store.channelTiktokLink ?? '',
      storeName: store.name,
      channelLink: store.telegramChannelId
        ? `https://t.me/${store.telegramChannelId.replace(/^@/, '')}`
        : '',
      productUrl,
    };
  }

  private buildContact(store: StoreForPost): string {
    if (store.channelContactPhone) return store.channelContactPhone;
    if (store.telegramContactLink) {
      // telegramContactLink обычно "@username" или "https://t.me/username"
      return store.telegramContactLink.startsWith('http')
        ? store.telegramContactLink
        : store.telegramContactLink;
    }
    return '';
  }

  private extractAttribute(
    attributes: Array<{ name: string; value: string }>,
    aliases: string[],
  ): string {
    const lowerAliases = aliases.map((a) => a.toLowerCase());
    const found = attributes.find((a) => lowerAliases.includes(a.name.toLowerCase()));
    return found?.value ?? '';
  }

  private extractSizes(
    variants: Array<{ titleOverride: string | null }>,
    attributes: Array<{ name: string; value: string }>,
  ): string {
    const fromAttr = this.extractAttribute(attributes, ['size', 'размер', 'razmer', 'o-lcham']);
    if (fromAttr) return fromAttr;

    const titles = variants
      .map((v) => v.titleOverride?.trim())
      .filter((t): t is string => Boolean(t));
    if (titles.length > 0 && titles.length <= 10) return titles.join('-');

    return '';
  }

  private formatPrice(amount: unknown, currency: string): string {
    const n = Number(String(amount));
    if (Number.isNaN(n)) return '—';
    return `${n.toLocaleString('ru-RU')} ${currency}`;
  }
}

type ProductForPost = {
  title: string;
  description: string | null;
  basePrice: unknown;
  salePrice: unknown;
  oldPrice: unknown;
  currencyCode: string;
  totalStock: number;
  attributes: Array<{ name: string; value: string }>;
  variants: Array<{ titleOverride: string | null }>;
};

type StoreForPost = {
  name: string;
  slug: string;
  telegramChannelId: string | null;
  telegramContactLink: string;
  channelPostTemplate: string | null;
  channelContactPhone: string | null;
  channelInstagramLink: string | null;
  channelTiktokLink: string | null;
};
