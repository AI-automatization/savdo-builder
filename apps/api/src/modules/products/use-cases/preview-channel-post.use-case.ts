import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ChannelTemplateService, TemplateVariables } from '../services/channel-template.service';

/**
 * FEAT-TG-CHANNEL-TEMPLATE-001: рендер preview шаблона без отправки в TG.
 *
 * Используется в UI редактора шаблона — продавец видит результат подстановки
 * на реальном товаре своего магазина (берём первый ACTIVE-товар) или на
 * фиксированном sample, если товаров ещё нет.
 *
 * Возвращает rendered caption (HTML) + meta — какой товар взят как sample
 * + список image URLs которые пойдут в media group (для UI mockup).
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
      ? this.realProductVars(product, store)
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

  private realProductVars(
    product: {
      id: string;
      title: string;
      description: string | null;
      basePrice: unknown;
      salePrice: unknown;
      oldPrice: unknown;
      currencyCode: string;
      totalStock: number;
      attributes: Array<{ name: string; value: string }>;
      variants: Array<{ titleOverride: string | null }>;
    },
    store: {
      name: string;
      slug: string;
      telegramChannelId: string | null;
      telegramContactLink: string;
      channelContactPhone: string | null;
      channelInstagramLink: string | null;
      channelTiktokLink: string | null;
    },
  ): TemplateVariables {
    const currency = product.currencyCode ?? 'UZS';
    const price = formatPrice(product.salePrice ?? product.basePrice, currency);
    const hasOldPrice = product.salePrice != null || product.oldPrice != null;
    const oldPrice = hasOldPrice
      ? formatPrice(product.salePrice != null ? product.basePrice : product.oldPrice, currency)
      : '';

    return {
      title: product.title,
      price,
      oldPrice,
      hasOldPrice,
      description: product.description ?? '',
      material: pickAttribute(product.attributes, ['material', 'материал', 'matn']),
      sizes: pickSizes(product.variants, product.attributes),
      availability: product.totalStock > 0 ? 'В наличии' : 'Под заказ',
      deliveryDays: '',
      contact: store.channelContactPhone || store.telegramContactLink,
      instagram: store.channelInstagramLink ?? '',
      tiktok: store.channelTiktokLink ?? '',
      storeName: store.name,
      channelLink: store.telegramChannelId
        ? `https://t.me/${store.telegramChannelId.replace(/^@/, '')}`
        : '',
      productUrl: buildProductUrl(store.slug, product.id),
    };
  }

  /** Sample-данные если у продавца нет ни одного товара. */
  private sampleVars(store: {
    name: string;
    slug: string;
    telegramChannelId: string | null;
    telegramContactLink: string;
    channelContactPhone: string | null;
    channelInstagramLink: string | null;
    channelTiktokLink: string | null;
  }): TemplateVariables {
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
      productUrl: buildProductUrl(store.slug, 'sample-product-id'),
    };
  }
}

function formatPrice(amount: unknown, currency: string): string {
  const n = Number(String(amount));
  if (Number.isNaN(n)) return '—';
  return `${n.toLocaleString('ru-RU')} ${currency}`;
}

function pickAttribute(attrs: Array<{ name: string; value: string }>, aliases: string[]): string {
  const lower = aliases.map((a) => a.toLowerCase());
  return attrs.find((a) => lower.includes(a.name.toLowerCase()))?.value ?? '';
}

function pickSizes(
  variants: Array<{ titleOverride: string | null }>,
  attrs: Array<{ name: string; value: string }>,
): string {
  const fromAttr = pickAttribute(attrs, ['size', 'размер', 'razmer']);
  if (fromAttr) return fromAttr;
  const titles = variants.map((v) => v.titleOverride?.trim()).filter((t): t is string => Boolean(t));
  if (titles.length > 0 && titles.length <= 10) return titles.join('-');
  return '';
}

function buildProductUrl(slug: string, productId: string): string {
  const base = (process.env.BUYER_URL ?? '').replace(/\/$/, '');
  return base ? `${base}/${slug}/products/${productId}` : `/${slug}/products/${productId}`;
}
