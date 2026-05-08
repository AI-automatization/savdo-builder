import { randomUUID } from 'crypto';
import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { MediaVisibility } from '@prisma/client';
import { TelegramStorageService } from '../services/telegram-storage.service';
import { R2StorageService } from '../services/r2-storage.service';
import { MediaRepository } from '../repositories/media.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

// Shared with request-upload.use-case.ts
const IMAGE_ONLY_PURPOSES = new Set(['product_image', 'store_logo', 'store_banner', 'buyer_avatar', 'seller_avatar', 'chat_photo']);
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_PURPOSES = new Set([...IMAGE_ONLY_PURPOSES, 'seller_doc']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Minimal file descriptor — matches Express.Multer.File fields we need */
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

function pickExtension(mimetype: string): string {
  if (mimetype === 'image/jpeg') return 'jpg';
  if (mimetype === 'image/png')  return 'png';
  if (mimetype === 'image/webp') return 'webp';
  return 'bin';
}

@Injectable()
export class UploadDirectUseCase {
  private readonly logger = new Logger(UploadDirectUseCase.name);

  constructor(
    private readonly tgStorage: TelegramStorageService,
    private readonly r2Storage: R2StorageService,
    private readonly mediaRepo: MediaRepository,
  ) {}

  async execute(userId: string, file: UploadedFile, purpose: string) {
    if (!ALLOWED_PURPOSES.has(purpose)) {
      throw new DomainException(
        ErrorCode.MEDIA_UPLOAD_TYPE_NOT_ALLOWED,
        `Unknown purpose: ${purpose}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (IMAGE_ONLY_PURPOSES.has(purpose) && !IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new DomainException(
        ErrorCode.MEDIA_UPLOAD_TYPE_NOT_ALLOWED,
        `mimeType ${file.mimetype} is not allowed for purpose ${purpose}. Use image/jpeg, image/png or image/webp.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new DomainException(
        ErrorCode.MEDIA_UPLOAD_TYPE_NOT_ALLOWED,
        'File size must not exceed 10 MB',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // ── Primary: R2/Supabase (S3-compatible) если сконфигурирован
    if (this.r2Storage.isConfigured()) {
      try {
        const bucket = this.r2Storage.getDefaultBucket();
        const ext = pickExtension(file.mimetype);
        const objectKey = `${purpose}/${new Date().getFullYear()}/${randomUUID()}.${ext}`;
        await this.r2Storage.uploadObject(bucket, objectKey, file.buffer, file.mimetype);

        const isPrivate = purpose === 'seller_doc';
        const mediaFile = await this.mediaRepo.create({
          ownerUserId: userId,
          bucket,
          objectKey,
          mimeType: file.mimetype,
          fileSize: BigInt(file.size),
          // SEC-005: документы продавцов приватны, не отдаются через public proxy.
          visibility: isPrivate ? MediaVisibility.PROTECTED : MediaVisibility.PUBLIC,
        });

        // Public Supabase: отдаём direct CDN URL (без 302 через /proxy/:id).
        // Раньше клиент делал GET /proxy → 302 → CDN — лишний round-trip.
        // PRIVATE/seller_doc остаются за /private/:id (там auth + RLS check).
        const publicUrl = !isPrivate ? this.r2Storage.getPublicUrl(objectKey) : '';
        return {
          mediaFileId: mediaFile.id,
          url: isPrivate
            ? `/api/v1/media/private/${mediaFile.id}`
            : (publicUrl || `/api/v1/media/proxy/${mediaFile.id}`),
        };
      } catch (err) {
        this.logger.error('R2/Supabase upload failed — falling back to Telegram', err instanceof Error ? err.stack : err);
        // продолжаем к Telegram fallback
      }
    }

    // ── Fallback: Telegram channel storage
    if (!this.tgStorage.isConfigured()) {
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Direct upload is not available — neither R2/Supabase nor Telegram storage configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    let fileId: string;
    try {
      fileId = await this.tgStorage.uploadFile(file.buffer, file.originalname, file.mimetype);
    } catch (err: unknown) {
      this.logger.error('Telegram upload failed', err instanceof Error ? err.stack : err);
      throw new DomainException(
        ErrorCode.MEDIA_UPLOAD_FAILED,
        'File upload failed — storage unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const mediaFile = await this.mediaRepo.create({
      ownerUserId: userId,
      bucket: 'telegram',
      objectKey: `tg:${fileId}`,
      mimeType: file.mimetype,
      fileSize: BigInt(file.size),
      visibility: MediaVisibility.PUBLIC,
    });

    return {
      mediaFileId: mediaFile.id,
      url: purpose === 'seller_doc'
        ? `/api/v1/media/private/${mediaFile.id}`
        : `/api/v1/media/proxy/${mediaFile.id}`,
    };
  }
}
