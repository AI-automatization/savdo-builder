import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { TelegramStorageService } from '../../media/services/telegram-storage.service';

/**
 * FEAT-TG-CHANNEL-PHOTO-001: resolver для отправки product images в TG-канал
 * как ОТКРЫТОЕ ФОТО (sendPhoto / sendMediaGroup type='photo'), а не файл.
 *
 * Telegram API ограничение: file_id, полученный через `sendDocument` upload
 * (наш `TelegramStorageService.uploadFile`), нельзя передать в `sendPhoto`.
 * Поэтому мы:
 *
 *   1) Если у MediaFile есть `photoFileId` — отдаём его (быстрый путь).
 *   2) Иначе — отдаём публичный URL фото (Telegram сам скачает и обработает).
 *      - bucket='telegram': временный URL через getFile (содержит bot token,
 *        используется только server-side при отправке в TG → не утекает).
 *      - bucket='r2' / иной: STORAGE_PUBLIC_URL/objectKey.
 *
 * После успешной отправки TelegramBotService возвращает photo file_id —
 * caller сохраняет его через `cachePhotoFileId(mediaId, fileId)` для
 * следующих публикаций.
 */
@Injectable()
export class ChannelMediaResolverService {
  private readonly logger = new Logger(ChannelMediaResolverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tgStorage: TelegramStorageService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Резолвит media-файл к виду, пригодному для sendPhoto/sendMediaGroup.
   * Возвращает `null` если файл недоступен (telegram-expired bucket или нет
   * objectKey) — caller должен пропустить это фото.
   */
  async resolveForChannelSend(media: {
    id: string;
    bucket: string;
    objectKey: string;
    photoFileId: string | null;
  }): Promise<string | null> {
    if (media.photoFileId) return media.photoFileId;

    if (media.bucket === 'telegram-expired') return null;
    if (!media.objectKey) return null;

    if (media.bucket === 'telegram') {
      try {
        return await this.tgStorage.getFileUrl(media.objectKey);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`getFileUrl failed for media=${media.id}: ${msg}`);
        return null;
      }
    }

    const publicBase = (this.config.get<string>('STORAGE_PUBLIC_URL') ?? '').replace(/\/$/, '');
    if (publicBase) return `${publicBase}/${media.objectKey}`;

    return null;
  }

  /**
   * Кэширует photo file_id после успешного sendPhoto/sendMediaGroup.
   * Update-only — не падает если media удалён concurrent.
   */
  async cachePhotoFileId(mediaId: string, photoFileId: string): Promise<void> {
    try {
      await this.prisma.mediaFile.update({
        where: { id: mediaId },
        data: { photoFileId },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`cachePhotoFileId failed media=${mediaId}: ${msg}`);
    }
  }
}
