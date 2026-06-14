import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChannelTemplateService } from '../services/channel-template.service';
import { ChannelMediaResolverService } from '../services/channel-media-resolver.service';
import { ChannelPostBuilderService } from '../services/channel-post-builder.service';

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
 *
 * Подготовка `TemplateVariables` и `productUrl` делегирована
 * `ChannelPostBuilderService` (DUP-002 refactor — единая правда c preview).
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
    private readonly templateService: ChannelTemplateService,
    private readonly mediaResolver: ChannelMediaResolverService,
    private readonly channelPostBuilder: ChannelPostBuilderService,
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

    const productUrl = this.channelPostBuilder.buildProductUrl(store.slug, product.id);
    const vars = this.channelPostBuilder.build(product, store, productUrl);
    const caption = this.templateService.render(store.channelPostTemplate, vars);

    const photos = await this.resolvePhotos(product.images);
    const buttons = [[{ text: '🛒 Открыть товар', url: productUrl }]];

    try {
      if (photos.length === 0) {
        await this.telegramBot.sendToChannel(store.telegramChannelId, caption, buttons, 'HTML');
        this.logger.log(`Posted product ${product.id} to channel ${store.telegramChannelId} (text-only)`);
      } else if (photos.length === 1) {
        const fileId = await this.telegramBot.sendPhotoToChannel(
          store.telegramChannelId, photos[0].src, caption, buttons, 'HTML',
        );
        if (fileId) {
          await this.mediaResolver.cachePhotoFileId(photos[0].mediaId, fileId);
          this.logger.log(`Posted product ${product.id} to channel ${store.telegramChannelId} (1 photo)`);
        } else {
          // Photo failed (sendPhotoToChannel returned null) — fall back to text-only
          this.logger.warn(`Photo failed for product ${product.id}, falling back to text-only post`);
          await this.telegramBot.sendToChannel(store.telegramChannelId, caption, buttons, 'HTML');
          this.logger.log(`Posted product ${product.id} to channel ${store.telegramChannelId} (text-only fallback)`);
        }
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
          this.logger.log(`Posted product ${product.id} to channel ${store.telegramChannelId} (${photos.length} photos)`);
        } else {
          // Media group failed — fall back to text-only
          this.logger.warn(`Media group failed for product ${product.id}, falling back to text-only post`);
          await this.telegramBot.sendToChannel(store.telegramChannelId, caption, buttons, 'HTML');
          this.logger.log(`Posted product ${product.id} to channel ${store.telegramChannelId} (text-only fallback)`);
        }
      }
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
}
