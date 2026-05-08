import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { PrismaService } from '../../../database/prisma.service';
import { TelegramStorageService } from '../../media/services/telegram-storage.service';
import { R2StorageService } from '../../media/services/r2-storage.service';

export interface MigrateResult {
  migrated: number;
  skipped: number;
  failed: number;
  errors: Array<{ mediaFileId: string; error: string }>;
}

/**
 * API-MEDIA-MIGRATION-TG-TO-R2-001:
 * Перенос старых MediaFile с bucket='telegram' в Supabase Storage (R2-совместимый).
 *
 * Контекст: до настройки STORAGE_REGION upload падал в TG fallback.
 * Сейчас в TG канале лежат фото с file_id который Telegram держит ~1ч —
 * после этого `getFile` возвращает 404. На web-buyer пустые квадраты.
 *
 * Скрипт идёт по всем `MediaFile WHERE bucket='telegram'`,
 * пытается скачать через `getFileUrl` + axios stream, заливает в Supabase,
 * обновляет bucket+objectKey. Если `getFile` вернул 404 (file expired) —
 * меняет bucket → 'telegram-expired', чтобы повторные прогоны их пропускали
 * и proxy/:id не пытался стримить мёртвый file_id (схема MediaFile не имеет
 * deletedAt — поэтому используем bucket-маркер).
 *
 * Запускать через `POST /admin/media/migrate-tg-to-r2?limit=100` (admin only).
 * Обработка батчами по `limit` (default 50) — чтобы Railway не таймаутил.
 */
@Injectable()
export class MigrateTgMediaToR2UseCase {
  private readonly logger = new Logger(MigrateTgMediaToR2UseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tgStorage: TelegramStorageService,
    private readonly r2Storage: R2StorageService,
  ) {}

  async execute(limit = 50): Promise<MigrateResult> {
    if (!this.r2Storage.isConfigured()) {
      throw new Error('R2/Supabase Storage не сконфигурирован — миграция невозможна');
    }
    if (!this.tgStorage.isConfigured()) {
      throw new Error('Telegram storage не сконфигурирован — нечего читать');
    }

    const files = await this.prisma.mediaFile.findMany({
      where: { bucket: 'telegram' },
      take: Math.min(Math.max(limit, 1), 200),
      orderBy: { createdAt: 'asc' }, // от старых к новым
    });

    const result: MigrateResult = { migrated: 0, skipped: 0, failed: 0, errors: [] };

    for (const file of files) {
      const tgFileId = file.objectKey.startsWith('tg:') ? file.objectKey.slice(3) : file.objectKey;
      try {
        // 1. Resolve TG URL (server-side только — bot token не покидает api).
        const url = await this.tgStorage.getFileUrl(tgFileId);

        // 2. Download buffer.
        const dl = await axios.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer',
          maxContentLength: 15 * 1024 * 1024, // 15 MB safety
        });
        const buffer = Buffer.from(dl.data);

        // 3. Upload to Supabase Storage.
        const ext = pickExtension(file.mimeType);
        const newObjectKey = `migrated/${file.createdAt.getFullYear()}/${randomUUID()}.${ext}`;
        const bucket = this.r2Storage.getDefaultBucket();
        await this.r2Storage.uploadObject(bucket, newObjectKey, buffer, file.mimeType);

        // 4. Update DB row — bucket + objectKey + size sync.
        await this.prisma.mediaFile.update({
          where: { id: file.id },
          data: {
            bucket,
            objectKey: newObjectKey,
            fileSize: BigInt(buffer.byteLength),
          },
        });

        result.migrated++;
        this.logger.log(`Migrated ${file.id}: tg:${tgFileId} → ${bucket}/${newObjectKey}`);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const msg = err instanceof Error ? err.message : String(err);

        // 404 от TG = file expired. Маркируем bucket → 'telegram-expired',
        // чтобы повторные прогоны их пропускали и proxy/:id не дёргал мёртвый file_id.
        if (status === 404 || msg.includes('Telegram getFile failed')) {
          await this.prisma.mediaFile.update({
            where: { id: file.id },
            data: { bucket: 'telegram-expired' },
          });
          result.skipped++;
          this.logger.warn(`Skipped ${file.id} (TG file expired) — bucket=telegram-expired`);
        } else {
          result.failed++;
          result.errors.push({ mediaFileId: file.id, error: msg });
          this.logger.error(`Failed ${file.id}: ${msg}`);
        }
      }
    }

    return result;
  }
}

function pickExtension(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'bin';
}
