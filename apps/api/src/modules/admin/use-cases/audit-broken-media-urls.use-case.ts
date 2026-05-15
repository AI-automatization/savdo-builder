import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../../database/prisma.service';

export interface AuditBrokenMediaInput {
  /** Размер батча (clamp 1..500). */
  limit?: number;
  /** id последней записи предыдущего батча — сканировать дальше неё. */
  cursorId?: string;
}

export interface AuditBrokenMediaResult {
  scanned: number;
  broken: number;
  ok: number;
  /** mediaFileId'ы помеченные bucket='broken' в этом прогоне. */
  markedIds: string[];
  /**
   * id последней просканированной записи. Передать как `cursorId` в следующий
   * вызов чтобы продолжить аудит. null — достигнут конец таблицы.
   */
  nextCursor: string | null;
}

/** Сколько HEAD-запросов выполнять параллельно. */
const HEAD_CONCURRENCY = 10;

/**
 * API-PRODUCT-IMAGES-BROKEN-SUPABASE-URLS-001:
 * После миграции TG→Supabase часть `MediaFile` получила `bucket` Supabase/R2,
 * но `objectKey` указывает на несуществующий файл (миграция упала на части
 * файлов / source file_id был мёртв уже на момент переноса). `resolveImageUrl`
 * строит `STORAGE_PUBLIC_URL/{objectKey}` → 404 → broken <img> на web-buyer.
 *
 * Этот use-case сканирует MediaFile (не telegram*, не уже-broken), делает
 * HEAD-запрос на public URL, и помечает мёртвые `bucket='broken'`. После
 * этого `resolveImageUrl` возвращает '' → фронт рендерит «Без фото» placeholder.
 *
 * **Cursor-пагинация.** Аудит идёт батчами через `cursorId` (id последней
 * записи). Без курсора (`take` от начала) повторный прогон всегда сканирует
 * первые N alive-записей и не доходит до хвоста таблицы. Admin листает:
 * `POST /admin/media/audit-broken-urls?limit=200` → берёт `nextCursor` из
 * ответа → `?limit=200&cursor=<id>` → пока `nextCursor` не null.
 *
 * HEAD-запросы идут пулом по {@link HEAD_CONCURRENCY} — иначе батч из мёртвых
 * URL'ов с 5s-таймаутом блокировал бы запрос на минуты.
 *
 * Idempotent — уже-broken записи не попадают в кандидаты.
 *
 * Схема MediaFile не имеет статус-поля — используем bucket-маркер, как
 * 'telegram-expired' в migrate-tg-media-to-r2 (тот же паттерн).
 */
@Injectable()
export class AuditBrokenMediaUrlsUseCase {
  private readonly logger = new Logger(AuditBrokenMediaUrlsUseCase.name);

  /** HEAD-запрос таймаут — не вешаем весь батч на медленный storage. */
  private readonly HEAD_TIMEOUT_MS = 5000;

  constructor(private readonly prisma: PrismaService) {}

  async execute(input: AuditBrokenMediaInput = {}): Promise<AuditBrokenMediaResult> {
    const empty: AuditBrokenMediaResult = {
      scanned: 0, broken: 0, ok: 0, markedIds: [], nextCursor: null,
    };

    const publicBase = (process.env.STORAGE_PUBLIC_URL ?? '').replace(/\/$/, '');
    if (!publicBase) {
      this.logger.warn('STORAGE_PUBLIC_URL не задан — audit невозможен');
      return empty;
    }

    const rawLimit = Number(input.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), 500)
      : 100;

    // Кандидаты: всё что resolveImageUrl попытается отдать как direct URL.
    // telegram / telegram-expired / broken — пропускаем (их resolveImageUrl
    // и так не строит как Supabase-URL). Cursor двигает окно по id.
    const candidates = await this.prisma.mediaFile.findMany({
      where: {
        bucket: { notIn: ['telegram', 'telegram-expired', 'broken'] },
        ...(input.cursorId ? { id: { gt: input.cursorId } } : {}),
      },
      select: { id: true, objectKey: true },
      orderBy: { id: 'asc' },
      take: limit,
    });

    if (candidates.length === 0) return empty;

    // HEAD-проверки пулом по HEAD_CONCURRENCY.
    const checks = await this.mapWithConcurrency(
      candidates,
      HEAD_CONCURRENCY,
      async (media) => ({
        id: media.id,
        alive: await this.isUrlAlive(`${publicBase}/${media.objectKey}`),
      }),
    );

    const brokenIds = checks.filter((c) => !c.alive).map((c) => c.id);
    if (brokenIds.length > 0) {
      await this.prisma.mediaFile.updateMany({
        where: { id: { in: brokenIds } },
        data: { bucket: 'broken' },
      });
    }

    const result: AuditBrokenMediaResult = {
      scanned: candidates.length,
      broken: brokenIds.length,
      ok: candidates.length - brokenIds.length,
      markedIds: brokenIds,
      // Если вернулся полный батч — возможно есть ещё; иначе конец таблицы.
      nextCursor:
        candidates.length === limit ? candidates[candidates.length - 1].id : null,
    };

    this.logger.log(
      `Broken-media audit: scanned ${result.scanned}, broken ${result.broken}, ` +
        `ok ${result.ok}, nextCursor ${result.nextCursor ?? '<end>'}`,
    );
    return result;
  }

  /**
   * HEAD-запрос. 2xx/3xx → alive. 404/403/любая сетевая ошибка → dead.
   * HEAD дешевле GET (не качаем тело).
   */
  private async isUrlAlive(url: string): Promise<boolean> {
    try {
      const res = await axios.head(url, {
        timeout: this.HEAD_TIMEOUT_MS,
        validateStatus: () => true, // не бросать на 4xx/5xx — сами проверим
      });
      return res.status >= 200 && res.status < 400;
    } catch {
      // network error / timeout / DNS — считаем мёртвым
      return false;
    }
  }

  /**
   * map с ограничением параллелизма — фиксированный пул воркеров разбирает
   * общую очередь индексов. Сохраняет порядок результатов.
   */
  private async mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    const worker = async (): Promise<void> => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    };
    const pool = Array.from({ length: Math.min(concurrency, items.length) }, worker);
    await Promise.all(pool);
    return results;
  }
}
