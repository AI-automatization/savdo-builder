import { Injectable, HttpStatus } from '@nestjs/common';
import { MediaVisibility } from '@prisma/client';
import { TelegramStorageService } from '../services/telegram-storage.service';
import { MediaRepository } from '../repositories/media.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

// Shared with request-upload.use-case.ts
const IMAGE_ONLY_PURPOSES = new Set(['product_image', 'store_logo', 'store_banner']);
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

@Injectable()
export class UploadDirectUseCase {
  constructor(
    private readonly tgStorage: TelegramStorageService,
    private readonly mediaRepo: MediaRepository,
  ) {}

  async execute(userId: string, file: UploadedFile, purpose: string) {
    if (!this.tgStorage.isConfigured()) {
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Direct upload is not available — Telegram storage is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

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

    const fileId = await this.tgStorage.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

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
      url: `/api/v1/media/proxy/${mediaFile.id}`,
    };
  }
}
