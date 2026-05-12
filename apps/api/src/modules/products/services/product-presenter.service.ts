import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

/**
 * ProductPresenterService — pure helpers + batch lookups для DTO-маппинга.
 *
 * Выделено из products.controller.ts как часть split на seller / storefront
 * controllers (см. analiz/done.md POLAT-ZONE-WAVE10). Раньше эти helpers
 * жили как private методы контроллера и блокировали разделение.
 *
 * Все методы pure (kроме батчей которые ходят в prisma). Stateless.
 */
@Injectable()
export class ProductPresenterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Decimal/number unknown → number | null. Используется для basePrice/oldPrice/salePrice
   * полей, которые Prisma возвращает как Decimal-объекты.
   */
  toPrice(val: unknown): number | null {
    if (val === null || val === undefined) return null;
    return Number(val);
  }

  /**
   * P3-004: считает trust-флаг скидки и процент.
   *
   * isSale: salePrice строго меньше basePrice (защита от 0-discount и negative).
   * discountPercent: floor((1 - salePrice/basePrice) * 100), clamp в [1, 99].
   *
   * Если нет скидки — `{ isSale: false, discountPercent: null }`. Фронт
   * использует это для бэйджа `SALE -30%` на ProductCard.
   */
  computeSale(
    basePrice: unknown,
    salePrice: unknown,
  ): { isSale: boolean; discountPercent: number | null } {
    const base = this.toPrice(basePrice);
    const sale = this.toPrice(salePrice);
    if (base === null || sale === null) return { isSale: false, discountPercent: null };
    if (base <= 0) return { isSale: false, discountPercent: null };
    if (sale <= 0 || sale >= base) return { isSale: false, discountPercent: null };
    const pct = Math.floor((1 - sale / base) * 100);
    if (pct < 1) return { isSale: false, discountPercent: null };
    return { isSale: true, discountPercent: Math.min(pct, 99) };
  }

  /**
   * P3-004: shortcut для DTO spread — возвращает все price-поля + sale-флаги.
   * Используется в product list/detail mappers, заменяет 3 строки бойлерплейта:
   *   basePrice + oldPrice + salePrice → +isSale +discountPercent.
   */
  priceFields(basePrice: unknown, oldPrice: unknown, salePrice: unknown): {
    basePrice: number;
    oldPrice: number | null;
    salePrice: number | null;
    isSale: boolean;
    discountPercent: number | null;
  } {
    const sale = this.computeSale(basePrice, salePrice);
    return {
      basePrice: Number(basePrice),
      oldPrice: this.toPrice(oldPrice),
      salePrice: this.toPrice(salePrice),
      ...sale,
    };
  }

  /**
   * Нормализация variant для DTO: Decimal → number, optionValues junctions → optionValueIds[].
   */
  normalizeVariant(variant: unknown): unknown {
    const v = variant as Record<string, unknown>;
    const junctions = (v['optionValues'] ?? []) as Array<{ optionValueId: string }>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { optionValues: _drop, priceOverride, oldPriceOverride, salePriceOverride, ...rest } = v;
    return {
      ...rest,
      priceOverride: this.toPrice(priceOverride),
      oldPriceOverride: this.toPrice(oldPriceOverride),
      salePriceOverride: this.toPrice(salePriceOverride),
      optionValueIds: junctions.map((j) => j.optionValueId),
    };
  }

  /**
   * Resolve absolute URL для media-объекта (R2 public CDN или прокси через API).
   * Telegram bucket ALWAYS proxy (file URLs expire ~1h), R2 — direct если STORAGE_PUBLIC_URL задан.
   */
  resolveImageUrl(media: unknown): string {
    const m = media as { id?: string; objectKey?: string; bucket?: string } | null | undefined;
    if (!m?.objectKey) return '';
    // API-BUCKET-NAME-CONSISTENCY-001: 'telegram-expired' = TG getFile вернул 404, fileId мёртв навсегда.
    if (m.bucket === 'telegram-expired') return '';
    const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');
    if (m.bucket === 'telegram') {
      return `${appUrl}/api/v1/media/proxy/${m.id}`;
    }
    const r2Base = process.env.STORAGE_PUBLIC_URL ?? '';
    if (r2Base) return `${r2Base}/${m.objectKey}`;
    return m.id && appUrl ? `${appUrl}/api/v1/media/proxy/${m.id}` : '';
  }

  /**
   * One-store вариант: получить logo/cover URLs для одного магазина.
   * 1 запрос в media_files для обоих ID.
   */
  async resolveStoreImageUrls(
    logoMediaId: string | null | undefined,
    coverMediaId: string | null | undefined,
  ): Promise<{ logoUrl: string | null; coverUrl: string | null }> {
    const ids = [logoMediaId, coverMediaId].filter(Boolean) as string[];
    if (!ids.length) return { logoUrl: null, coverUrl: null };

    const files = await this.prisma.mediaFile.findMany({
      where: { id: { in: ids } },
      select: { id: true, bucket: true, objectKey: true },
    });
    const map = new Map(files.map((f) => [f.id, f]));

    const resolve = (id: string | null | undefined): string | null => {
      if (!id) return null;
      const m = map.get(id);
      if (!m) return null;
      return this.resolveImageUrl(m) || null;
    };

    return { logoUrl: resolve(logoMediaId), coverUrl: resolve(coverMediaId) };
  }

  /**
   * Batch-вариант для списка магазинов: 1 SELECT на все logo/cover IDs.
   * Раньше per-store вызов давал N+1 (см. perf wave 4).
   */
  async attachStoreImageUrls<T extends { logoMediaId?: string | null; coverMediaId?: string | null }>(
    stores: T[],
  ): Promise<Array<Omit<T, 'logoMediaId' | 'coverMediaId'> & { logoUrl: string | null; coverUrl: string | null }>> {
    const ids = new Set<string>();
    for (const s of stores) {
      if (s.logoMediaId) ids.add(s.logoMediaId);
      if (s.coverMediaId) ids.add(s.coverMediaId);
    }

    const map = new Map<string, { id: string; bucket: string; objectKey: string }>();
    if (ids.size > 0) {
      const files = await this.prisma.mediaFile.findMany({
        where: { id: { in: [...ids] } },
        select: { id: true, bucket: true, objectKey: true },
      });
      for (const f of files) map.set(f.id, f);
    }

    const resolveOne = (id: string | null | undefined): string | null => {
      if (!id) return null;
      const m = map.get(id);
      if (!m) return null;
      return this.resolveImageUrl(m) || null;
    };

    return stores.map((s) => {
      const { logoMediaId, coverMediaId, ...rest } = s;
      return {
        ...(rest as Omit<T, 'logoMediaId' | 'coverMediaId'>),
        logoUrl: resolveOne(logoMediaId),
        coverUrl: resolveOne(coverMediaId),
      };
    });
  }
}
