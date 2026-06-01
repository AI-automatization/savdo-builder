import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChannelTemplateService, TemplateVariables } from '../services/channel-template.service';
import { ChannelPostBuilderService, ChannelPostStoreInput } from '../services/channel-post-builder.service';

/**
 * FEAT-TG-CHANNEL-TEMPLATE-001: рендер preview шаблона без отправки в TG.
 *
 * Используется в UI редактора шаблона — продавец видит результат подстановки
 * на реальном товаре своего магазина (берём первый ACTIVE-товар) или на
 * фиксированном sample, если товаров ещё нет.
 *
 * Возвращает rendered caption (HTML) + meta — какой товар взят как sample
 * + список image URLs которые пойдут в media group (для UI mockup).
 *
 * Построение `TemplateVariables` делегировано `ChannelPostBuilderService` —
 * preview обязан байт-в-байт совпадать с реальным постом
 * (`PostProductToChannelUseCase`). См. DUP-002 в analiz/dry-audit-2026-06-01.md.
 */

export interface PreviewInput {
  sellerUserId: string;
  /** Опционально: рендерить с этим шаблоном (для live-preview в редакторе),
   *  иначе используется сохранённый `store.channelPostTemplate`. */
  templateOverride?: string;
  /** Опционально: конкретный productId для preview. Иначе — первый товар. */
  productId?: string;
}

export interface PreviewResult {
  caption: string;
  sampleProductId: string | null;
  sampleProductTitle: string | null;
}

@Injectable()
export class PreviewChannelPostUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateService: ChannelTemplateService,
    private readonly channelPostBuilder: ChannelPostBuilderService,
  ) {}

  async execute(input: PreviewInput): Promise<PreviewResult> {
    const seller = await this.prisma.seller.findFirst({
      where: { userId: input.sellerUserId },
      select: { id: true },
    });
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }

    const store = await this.prisma.store.findFirst({
      where: { sellerId: seller.id, deletedAt: null },
    });
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    const product = await this.findSampleProduct(store.id, input.productId);

    const vars: TemplateVariables = product
      ? this.channelPostBuilder.build(
          product,
          store,
          this.channelPostBuilder.buildProductUrl(store.slug, product.id),
        )
      : this.sampleVars(store);

    const template = input.templateOverride !== undefined
      ? input.templateOverride
      : store.channelPostTemplate;

    const caption = this.templateService.render(template, vars);

    return {
      caption,
      sampleProductId: product?.id ?? null,
      sampleProductTitle: product?.title ?? null,
    };
  }

  private async findSampleProduct(storeId: string, productId?: string) {
    const include = {
      attributes: { select: { name: true, value: true } },
      variants: { select: { titleOverride: true } },
    } as const;
    if (productId) {
      return this.prisma.product.findFirst({
        where: { id: productId, storeId, deletedAt: null },
        include,
      });
    }
    return this.prisma.product.findFirst({
      where: { storeId, deletedAt: null, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include,
    });
  }

  /** Sample-данные если у продавца нет ни одного товара. */
  private sampleVars(store: ChannelPostStoreInput): TemplateVariables {
    return {
      title: 'Брендовые рубашки',
      price: '399 000 UZS',
      oldPrice: '',
      hasOldPrice: false,
      description: '',
      material: 'хлопок',
      sizes: 'M-L-XL-2XL-3XL',
      availability: 'В наличии',
      deliveryDays: '1',
      contact: store.channelContactPhone || store.telegramContactLink,
      instagram: store.channelInstagramLink ?? '',
      tiktok: store.channelTiktokLink ?? '',
      storeName: store.name,
      channelLink: store.telegramChannelId
        ? `https://t.me/${store.telegramChannelId.replace(/^@/, '')}`
        : '',
      productUrl: this.channelPostBuilder.buildProductUrl(store.slug, 'sample-product-id'),
    };
  }
}
