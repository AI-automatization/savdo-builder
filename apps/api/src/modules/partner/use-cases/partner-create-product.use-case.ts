import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Product, ProductStatus } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { CreateProductUseCase } from '../../products/use-cases/create-product.use-case';
import { ChangeProductStatusUseCase } from '../../products/use-cases/change-product-status.use-case';
import { ProductImagesRepository } from '../../products/repositories/product-images.repository';
import { UploadDirectUseCase } from '../../media/use-cases/upload-direct.use-case';
import { PartnerContext } from '../guards/partner-api-key.guard';
import { PartnerCreateProductDto } from '../dto/partner-create-product.dto';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB — как в UploadDirectUseCase
const DOWNLOAD_TIMEOUT_MS = 15_000;

// Базовая анти-SSRF проверка: https обеспечен DTO, здесь режем локальные/
// приватные хосты. Партнёр аутентифицирован ключом (ключи выдаём вручную),
// поэтому полный DNS-resolve не делаем — это barrier против очевидного абьюза.
function assertSafeImageUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      `Invalid image URL: ${raw}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  const host = url.hostname.toLowerCase();
  const isIpLiteral = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':');
  if (
    isIpLiteral ||
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      'Image URL must point to a public hostname',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  return url;
}

/**
 * PARTNER-API-RAOS-001: создание товара внешним партнёром.
 *
 * Поток: скачать фото по URL (все — до записи в БД, фото обязательно) →
 * CreateProductUseCase (лимиты тарифа применяются как у обычного продавца) →
 * привязать фото → опционально DRAFT→ACTIVE через ChangeProductStatusUseCase
 * (он же триггерит автопост в TG-канал продавца).
 */
@Injectable()
export class PartnerCreateProductUseCase {
  private readonly logger = new Logger(PartnerCreateProductUseCase.name);

  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly changeStatus: ChangeProductStatusUseCase,
    private readonly imagesRepo: ProductImagesRepository,
    private readonly uploadDirect: UploadDirectUseCase,
  ) {}

  async execute(ctx: PartnerContext, dto: PartnerCreateProductDto): Promise<{
    product: Product;
    imageCount: number;
  }> {
    // 1. Скачиваем ВСЕ фото до создания товара: правило «только с фото» —
    //    если ни одно фото не скачалось, товар не создаём вообще.
    const buffers = await Promise.all(dto.imageUrls.map((u) => this.downloadImage(u)));

    // 2. Создаём товар (внутри — проверка лимита товаров тарифа магазина).
    const product = await this.createProduct.execute(ctx.storeId, {
      title: dto.title,
      description: dto.description,
      basePrice: dto.basePrice,
      currencyCode: dto.currencyCode,
      sku: dto.sku,
      isVisible: true,
    });

    // 3. Заливаем фото в R2 и привязываем. Владелец media — владелец магазина.
    let attached = 0;
    for (let i = 0; i < buffers.length; i++) {
      const img = buffers[i];
      try {
        const media = await this.uploadDirect.execute(
          ctx.sellerUserId,
          {
            buffer: img.buffer,
            originalname: `partner-${ctx.keyName}-${i}.jpg`,
            mimetype: img.mimeType,
            size: img.buffer.length,
          },
          'product_image',
        );
        await this.imagesRepo.create({
          productId: product.id,
          mediaId: media.mediaFileId,
          sortOrder: i,
          isPrimary: i === 0,
        });
        attached++;
      } catch (err) {
        this.logger.warn(
          `image attach failed (product=${product.id}, idx=${i}): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Ни одно фото не прикрепилось (например R2 недоступен) — правило
    // «faqat rasmi bor» нарушено, оставляем DRAFT и возвращаем 502-семантику.
    if (attached === 0) {
      throw new DomainException(
        ErrorCode.MEDIA_UPLOAD_FAILED,
        'Product created as DRAFT but no image could be stored — retry later',
        HttpStatus.BAD_GATEWAY,
      );
    }

    // 4. Публикация (DRAFT→ACTIVE) — переиспользуем seller-переход, он
    //    валидирует state machine и триггерит автопост в канал.
    let finalProduct = product;
    if (dto.publish !== false) {
      finalProduct = await this.changeStatus.execute(product.id, ctx.storeId, ProductStatus.ACTIVE);
    }

    return { product: finalProduct, imageCount: attached };
  }

  private async downloadImage(rawUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const url = assertSafeImageUrl(rawUrl);

    let res: Response;
    try {
      res = await fetch(url, {
        signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
        redirect: 'follow',
      });
    } catch (err) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Image download failed: ${rawUrl} (${err instanceof Error ? err.message : 'network error'})`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (!res.ok) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Image download failed: ${rawUrl} (HTTP ${res.status})`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const mimeType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!IMAGE_MIME_TYPES.has(mimeType)) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Unsupported image type '${mimeType}' at ${rawUrl} — use image/jpeg, image/png or image/webp`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Image at ${rawUrl} is empty or exceeds 10 MB`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return { buffer, mimeType };
  }
}
