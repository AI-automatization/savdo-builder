import { randomUUID } from 'crypto';
import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { MediaVisibility } from '@prisma/client';
import axios from 'axios';
import { R2StorageService } from '../services/r2-storage.service';
import { MediaRepository } from '../repositories/media.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

// Hugging Face BRIA RMBG-1.4 — бесплатно, без credits, качество = remove.bg
const HF_API = 'https://api-inference.huggingface.co/models/briaai/RMBG-1.4';

@Injectable()
export class RemoveBackgroundUseCase {
  private readonly logger = new Logger(RemoveBackgroundUseCase.name);

  constructor(
    private readonly r2Storage: R2StorageService,
    private readonly mediaRepo: MediaRepository,
  ) {}

  async execute(input: { mediaId: string; ownerUserId: string }) {
    const hfToken = process.env.HUGGINGFACE_API_TOKEN;
    if (!hfToken) {
      throw new DomainException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'HUGGINGFACE_API_TOKEN not configured',
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

    // Скачиваем оригинал из R2 чтобы отправить бинарник в HF (надёжнее чем URL)
    const imageUrl = this.r2Storage.getPublicUrl(media.objectKey);
    let originalBuffer: Buffer;
    try {
      const dl = await axios.get<ArrayBuffer>(imageUrl, { responseType: 'arraybuffer', timeout: 15_000 });
      originalBuffer = Buffer.from(dl.data);
    } catch {
      throw new DomainException(ErrorCode.SERVICE_UNAVAILABLE, 'Failed to download source image', HttpStatus.SERVICE_UNAVAILABLE);
    }

    let pngBuffer: Buffer;
    try {
      const response = await axios.post<ArrayBuffer>(
        HF_API,
        originalBuffer,
        {
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': media.mimeType ?? 'image/jpeg',
            'Accept': 'image/png',
          },
          responseType: 'arraybuffer',
          timeout: 60_000, // HF cold start может быть ~20-30s
        },
      );
      pngBuffer = Buffer.from(response.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      this.logger.error(`HuggingFace RMBG failed status=${status ?? 'none'}`);
      if (status === 503) {
        throw new DomainException(ErrorCode.SERVICE_UNAVAILABLE, 'AI model is loading, retry in 30s', HttpStatus.SERVICE_UNAVAILABLE);
      }
      throw new DomainException(ErrorCode.SERVICE_UNAVAILABLE, 'Background removal service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
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
