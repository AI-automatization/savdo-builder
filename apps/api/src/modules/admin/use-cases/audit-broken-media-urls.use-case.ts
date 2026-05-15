import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../../database/prisma.service';

export interface AuditBrokenMediaResult {
  scanned: number;
  broken: number;
  ok: number;
  /** mediaFileId'ы помеченные bucket='broken' в этом прогоне. */
  markedIds: string[];
}

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
 * Запускать батчами: `POST /admin/media/audit-broken-urls?limit=100` (admin).
 * Idempotent — уже-broken записи пропускаются (не сканируются повторно).
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

  async execute(limit = 100): Promise<AuditBrokenMediaResult> {
    const publicBase = (process.env.STORAGE_PUBLIC_URL ?? '').replace(/\/$/, '');
    if (!publicBase) {
      this.logger.warn('STORAGE_PUBLIC_URL не задан — audit невозможен');
      return { scanned: 0, broken: 0, ok: 0, markedIds: [] };
    }

    // Кандидаты: всё что resolveImageUrl попытается отдать как direct URL.
    // telegram / telegram-expired / broken — пропускаем (их resolveImageUrl
    // и так не строит как Supabase-URL).
    const candidates = await this.prisma.mediaFile.findMany({
      where: {
        bucket: { notIn: ['telegram', 'telegram-expired', 'broken'] },
      },
      select: { id: true, objectKey: true },
      orderBy: { id: 'asc' },
      take: Math.min(Math.max(limit, 1), 500),
    });

    if (candidates.length === 0) {
      return { scanned: 0, broken: 0, ok: 0, markedIds: [] };
    }

    let broken = 0;
    let ok = 0;
    const markedIds: string[] = [];

    for (const media of candidates) {
      const url = `${publicBase}/${media.objectKey}`;
      const alive = await this.isUrlAlive(url);
      if (alive) {
        ok++;
        continue;
      }
      // Мёртвый URL — помечаем bucket='broken'.
      await this.prisma.mediaFile.update({
        where: { id: media.id },
        data: { bucket: 'broken' },
      });
      broken++;
      markedIds.push(media.id);
    }

    this.logger.log(
      `Broken-media audit: scanned ${candidates.length}, broken ${broken}, ok ${ok}`,
    );
    return { scanned: candidates.length, broken, ok, markedIds };
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
}
