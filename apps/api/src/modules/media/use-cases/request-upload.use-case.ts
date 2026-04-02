import { Injectable, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediaVisibility } from '@prisma/client';
import { R2StorageService } from '../services/r2-storage.service';
import { MediaRepository } from '../repositories/media.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { ConfigService } from '@nestjs/config';

// Purposes that accept only images
const IMAGE_ONLY_PURPOSES = new Set(['product_image', 'store_logo', 'store_banner']);
// Purposes that accept images and PDFs
const DOCUMENT_PURPOSES = new Set(['seller_doc']);

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DOCUMENT_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

@Injectable()
export class RequestUploadUseCase {
  constructor(
    private readonly r2Storage: R2StorageService,
    private readonly mediaRepo: MediaRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    userId: string,
    data: { mimeType: string; purpose: string; sizeBytes: number },
  ) {
    if (!this.r2Storage.isConfigured()) {
      throw new DomainException(
        ErrorCode.MEDIA_UPLOAD_TYPE_NOT_ALLOWED,
        'File upload is not available — storage is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const { mimeType, purpose, sizeBytes } = data;

    // Validate mimeType is allowed for the given purpose
    if (IMAGE_ONLY_PURPOSES.has(purpose) && !IMAGE_MIME_TYPES.has(mimeType)) {
      throw new DomainException(
        ErrorCode.MEDIA_UPLOAD_TYPE_NOT_ALLOWED,
        `mimeType ${mimeType} is not allowed for purpose ${purpose}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (DOCUMENT_PURPOSES.has(purpose) && !DOCUMENT_MIME_TYPES.has(mimeType)) {
      throw new DomainException(
        ErrorCode.INVALID_FILE_TYPE,
        `mimeType ${mimeType} is not allowed for purpose ${purpose}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const ext = MIME_TO_EXT[mimeType];
    const objectKey = `${purpose}/${userId}/${randomUUID()}.${ext}`;

    // Private bucket for seller docs, public bucket for everything else
    const bucket = purpose === 'seller_doc'
      ? (this.configService.get<string>('storage.bucketPrivate') ?? 'savdo-private')
      : (this.configService.get<string>('storage.bucketPublic') ?? 'savdo-public');

    // Pending uploads start as PRIVATE; confirm endpoint promotes to PUBLIC (or PROTECTED for docs)
    const visibility =
      purpose === 'seller_doc' ? MediaVisibility.PROTECTED : MediaVisibility.PRIVATE;

    const { uploadUrl, expiresIn } = await this.r2Storage.generateUploadUrl(
      bucket,
      objectKey,
      mimeType,
    );

    const mediaFile = await this.mediaRepo.create({
      ownerUserId: userId,
      bucket,
      objectKey,
      mimeType,
      fileSize: BigInt(sizeBytes),
      visibility,
    });

    return {
      mediaFileId: mediaFile.id,
      uploadUrl,
      expiresIn,
      objectKey,
    };
  }
}
