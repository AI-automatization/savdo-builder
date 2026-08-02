import { randomUUID } from 'crypto';
import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { MediaVisibility } from '@prisma/client';
import sharp from 'sharp';
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

    if (!this.r2Storage.isConfigured()) {
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Storage not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const bucket = this.r2Storage.getDefaultBucket();

    let uploadBuffer = file.buffer;
    let uploadMime = file.mimetype;
    let uploadExt = pickExtension(file.mimetype);

    if (IMAGE_MIME_TYPES.has(file.mimetype) && purpose !== 'seller_doc') {
      try {
        uploadBuffer = await sharp(file.buffer)
          .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 92 })
          .toBuffer();
        uploadMime = 'image/jpeg';
        uploadExt = 'jpg';
      } catch (sharpErr) {
        this.logger.warn(`Sharp processing failed, uploading original: ${sharpErr instanceof Error ? sharpErr.message : String(sharpErr)}`);
      }
    }

    const objectKey = `${purpose}/${new Date().getFullYear()}/${randomUUID()}.${uploadExt}`;

    try {
      await this.r2Storage.uploadObject(bucket, objectKey, uploadBuffer, uploadMime);
    } catch (err) {
      this.logger.error('R2 upload failed', err instanceof Error ? err.stack : err);
      throw new DomainException(
        ErrorCode.MEDIA_UPLOAD_FAILED,
        'File upload failed — R2 storage unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const isPrivate = purpose === 'seller_doc';
    const mediaFile = await this.mediaRepo.create({
      ownerUserId: userId,
      bucket,
      objectKey,
      mimeType: uploadMime,
      fileSize: BigInt(uploadBuffer.length),
      // SEC-005: документы продавцов приватны, не отдаются через public proxy.
      visibility: isPrivate ? MediaVisibility.PROTECTED : MediaVisibility.PUBLIC,
    });

    const publicUrl = !isPrivate ? this.r2Storage.getPublicUrl(objectKey) : '';
    return {
      mediaFileId: mediaFile.id,
      url: isPrivate
        ? `/api/v1/media/private/${mediaFile.id}`
        : (publicUrl || `/api/v1/media/proxy/${mediaFile.id}`),
    };
  }
}
