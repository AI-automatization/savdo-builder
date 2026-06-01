import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemplateVariables } from './channel-template.service';

/**
 * DUP-002 (см. analiz/dry-audit-2026-06-01.md): единый источник правды
 * для построения `TemplateVariables` (FEAT-TG-CHANNEL-TEMPLATE-001).
 *
 * До рефакторинга preview-channel-post.use-case + post-product-to-channel.use-case
 * содержали 1:1 копии `formatPrice`/`extractAttribute`/`extractSizes`/`buildProductUrl`/
 * `buildContact`/`buildTemplateVariables` — но они дрейфовали: алиас `o-lcham`
 * был только в `post-product-to-channel`, поэтому preview врал продавцу.
 *
 * Канонической принята версия из `post-product-to-channel.use-case.ts` (с `o-lcham`).
 *
 * ВНИМАНИЕ: НЕ менять контракт `TemplateVariables` — template-строка
 * Telegram-бота уже зависит от ключей (см. `ChannelTemplateService.DEFAULT_TEMPLATE`).
 */

export type { TemplateVariables } from './channel-template.service';

export interface ChannelPostProductInput {
  id?: string;
  title: string;
  description: string | null;
  basePrice: unknown;
  salePrice: unknown;
  oldPrice: unknown;
  currencyCode: string;
  totalStock: number;
  attributes: Array<{ name: string; value: string }>;
  variants: Array<{ titleOverride: string | null }>;
}

export interface ChannelPostStoreInput {
  name: string;
  slug: string;
  telegramChannelId: string | null;
  telegramContactLink: string;
  channelContactPhone: string | null;
  channelInstagramLink: string | null;
  channelTiktokLink: string | null;
}

@Injectable()
export class ChannelPostBuilderService {
  constructor(private readonly config?: ConfigService) {}

  /**
   * Собирает готовый `TemplateVariables` для рендера через `ChannelTemplateService`.
   *
   * @param product — товар с уже подгруженными `attributes` + `variants`.
   * @param store — магазин с channel-настройками.
   * @param productUrl — заранее сформированная ссылка на товар (нужна, потому что
   *  для preview product может быть sample без реального id). См. `buildProductUrl`.
   */
  build(
    product: ChannelPostProductInput,
    store: ChannelPostStoreInput,
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

  /**
   * Каноническая ссылка на товар. Если `BUYER_URL` известен — публичная веб-ссылка
   * `<buyer>/<storeSlug>/products/<id>`. Иначе fallback на startapp-deeplink в бот
   * (`https://t.me/<bot>?startapp=product_<id>`).
   */
  buildProductUrl(storeSlug: string, productId: string): string {
    const buyerBaseUrl = (
      this.config?.get<string>('app.buyerUrl') ?? process.env.BUYER_URL ?? ''
    ).replace(/\/$/, '');
    if (buyerBaseUrl) return `${buyerBaseUrl}/${storeSlug}/products/${productId}`;

    const botUsername =
      this.config?.get<string>('telegram.botUsername') ?? 'savdo_builderBOT';
    return `https://t.me/${botUsername}?startapp=product_${productId}`;
  }

  formatPrice(amount: unknown, currency: string): string {
    const n = Number(String(amount));
    if (Number.isNaN(n)) return '—';
    return `${n.toLocaleString('ru-RU')} ${currency}`;
  }

  private buildContact(store: ChannelPostStoreInput): string {
    if (store.channelContactPhone) return store.channelContactPhone;
    if (store.telegramContactLink) {
      // telegramContactLink обычно "@username" или "https://t.me/username"
      return store.telegramContactLink;
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
    // `o-lcham` — узбекский «о́лчам» (размер), часть канонической версии из
    // post-product-to-channel.use-case до рефакторинга.
    const fromAttr = this.extractAttribute(attributes, ['size', 'размер', 'razmer', 'o-lcham']);
    if (fromAttr) return fromAttr;

    const titles = variants
      .map((v) => v.titleOverride?.trim())
      .filter((t): t is string => Boolean(t));
    if (titles.length > 0 && titles.length <= 10) return titles.join('-');

    return '';
  }
}
