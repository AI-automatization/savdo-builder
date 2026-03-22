import { Injectable, HttpStatus } from '@nestjs/common';
import { MediaVisibility } from '@prisma/client';
import { MediaRepository } from '../repositories/media.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

// A file is considered confirmed when its visibility is not PRIVATE.
// product_image / store_logo / store_banner → PUBLIC after confirm
// seller_doc → PROTECTED after confirm
// PRIVATE is the pending/unconfirmed state for image-type uploads.
const PENDING_VISIBILITIES = new Set<MediaVisibility>([MediaVisibility.PRIVATE]);

@Injectable()
export class ConfirmUploadUseCase {
  constructor(private readonly mediaRepo: MediaRepository) {}

  async execute(mediaFileId: string, userId: string) {
    const mediaFile = await this.mediaRepo.findById(mediaFileId);

    if (!mediaFile) {
      throw new DomainException(
        ErrorCode.MEDIA_NOT_FOUND,
        'Media file not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (mediaFile.ownerUserId !== userId) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'You do not own this media file',
        HttpStatus.FORBIDDEN,
      );
    }

    // Idempotent: if already confirmed (not PRIVATE), return as-is
    if (!PENDING_VISIBILITIES.has(mediaFile.visibility)) {
      return mediaFile;
    }

    return this.mediaRepo.confirm(mediaFileId);
  }
}
