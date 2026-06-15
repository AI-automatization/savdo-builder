import { randomUUID } from 'crypto';
import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { MediaVisibility } from '@prisma/client';
import axios from 'axios';
import { R2StorageService } from '../services/r2-storage.service';
import { MediaRepository } from '../repositories/media.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const REMOVE_BG_API = 'https://api.remove.bg/v1.0/removebg';

@Injectable()
export class RemoveBackgroundUseCase {
  private readonly logger = new Logger(RemoveBackgroundUseCase.name);

  constructor(
    private readonly r2Storage: R2StorageService,
    private readonly mediaRepo: MediaRepository,
  ) {}

  async execute(input: { mediaId: string; ownerUserId: string }) {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'REMOVE_BG_API_KEY not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const media = await this.mediaRepo.findById(input.mediaId);
    if (!media) {
      throw new DomainException(ErrorCode.MEDIA_NOT_FOUND, 'Media file not found', HttpStatus.NOT_FOUND);
    }
    if (media.ownerUserId !== input.ownerUserId) {
      throw new DomainException(ErrorCode.MEDIA_NOT_OWNED, 'Access denied', HttpStatus.FORBIDDEN);
    }
    if (media.bucket === 'telegram' || media.bucket === 'telegram-expired') {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'Background removal is not supported for Telegram-stored images. Re-upload to R2 first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const imageUrl = this.r2Storage.getPublicUrl(media.objectKey);

    let pngBuffer: Buffer;
    try {
      const response = await axios.post<Buffer>(
        REMOVE_BG_API,
        new URLSearchParams({ image_url: imageUrl, size: 'auto', format: 'png' }).toString(),
        {
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          responseType: 'arraybuffer',
          timeout: 30_000,
        },
      );
      pngBuffer = Buffer.from(response.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: unknown } })?.response?.status;
      const body = (err as { response?: { data?: unknown } })?.response?.data;
      this.logger.error(`remove.bg failed status=${status ?? 'none'} body=${JSON.stringify(body)}`);

      if (status === 402) {
        throw new DomainException(
          ErrorCode.SERVICE_UNAVAILABLE,
          'remove.bg API credit exhausted — top up or switch plan',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Background removal service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const bucket = media.bucket;
    const objectKey = `product_image/${new Date().getFullYear()}/${randomUUID()}-nobg.png`;
    await this.r2Storage.uploadObject(bucket, objectKey, pngBuffer, 'image/png');

    const newMedia = await this.mediaRepo.create({
      ownerUserId: input.ownerUserId,
      bucket,
      objectKey,
      mimeType: 'image/png',
      fileSize: BigInt(pngBuffer.length),
      visibility: MediaVisibility.PUBLIC,
    });

    const url = this.r2Storage.getPublicUrl(objectKey) || `/api/v1/media/proxy/${newMedia.id}`;
    return { mediaFileId: newMedia.id, url };
  }
}
