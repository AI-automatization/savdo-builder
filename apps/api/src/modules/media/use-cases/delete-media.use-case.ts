import { Injectable, HttpStatus } from '@nestjs/common';
import { R2StorageService } from '../services/r2-storage.service';
import { MediaRepository } from '../repositories/media.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

@Injectable()
export class DeleteMediaUseCase {
  constructor(
    private readonly r2Storage: R2StorageService,
    private readonly mediaRepo: MediaRepository,
  ) {}

  async execute(mediaFileId: string, userId: string): Promise<void> {
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

    await this.r2Storage.deleteObject(mediaFile.bucket, mediaFile.objectKey);
    await this.mediaRepo.delete(mediaFileId);
  }
}
