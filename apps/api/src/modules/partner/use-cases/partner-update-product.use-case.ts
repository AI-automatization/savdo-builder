import { HttpStatus, Injectable } from '@nestjs/common';
import { Product, ProductStatus } from '@prisma/client';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { UpdateProductUseCase } from '../../products/use-cases/update-product.use-case';
import { ChangeProductStatusUseCase } from '../../products/use-cases/change-product-status.use-case';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { ProductImagesRepository } from '../../products/repositories/product-images.repository';
import { UploadDirectUseCase } from '../../media/use-cases/upload-direct.use-case';
import { assertProductOwnership } from '../../products/guards/product-ownership.guard';
import { PartnerContext } from '../guards/partner-api-key.guard';
import { PartnerUpdateProductDto } from '../dto/partner-update-product.dto';
import { downloadPartnerImage } from '../utils/partner-image.util';

interface ProductImageRef {
  id: string;
  isPrimary: boolean;
  sortOrder: number;
}

/**
 * INTEG-RAOS-002 (issue #5): PATCH /partner/products/:id.
 *
 * Поля партнёрского payload (name/price/description/imageUrl/isActive)
 * маппятся на наш домен и применяются независимо друг от друга — партнёр
 * шлёт только то, что реально изменилось (Partial на RAOS-стороне).
 */
@Injectable()
export class PartnerUpdateProductUseCase {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly changeStatus: ChangeProductStatusUseCase,
    private readonly imagesRepo: ProductImagesRepository,
    private readonly uploadDirect: UploadDirectUseCase,
  ) {}

  async execute(ctx: PartnerContext, productId: string, dto: PartnerUpdateProductDto): Promise<Product> {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new DomainException(
        ErrorCode.PRODUCT_NOT_FOUND,
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }
    assertProductOwnership(product, ctx.storeId);

    let updated: Product = product;
    const currentStatus = product.status;

    if (dto.name !== undefined || dto.price !== undefined || dto.description !== undefined) {
      updated = await this.updateProduct.execute(productId, ctx.storeId, {
        title: dto.name,
        basePrice: dto.price,
        description: dto.description,
      });
    }

    if (dto.imageUrl !== undefined) {
      await this.replacePrimaryImage(ctx, product.id, product.images, dto.imageUrl);
    }

    // isActive — маппинг на нашу state machine. Нет-op если товар уже в целевом
    // состоянии (партнёр может слать isActive идемпотентно при ретраях).
    if (dto.isActive !== undefined) {
      const isCurrentlyActive = currentStatus === ProductStatus.ACTIVE;
      if (dto.isActive && !isCurrentlyActive) {
        updated = await this.changeStatus.execute(productId, ctx.storeId, ProductStatus.ACTIVE);
      } else if (!dto.isActive && isCurrentlyActive) {
        updated = await this.changeStatus.execute(productId, ctx.storeId, ProductStatus.ARCHIVED);
      }
    }

    return updated;
  }

  private async replacePrimaryImage(
    ctx: PartnerContext,
    productId: string,
    images: ProductImageRef[],
    imageUrl: string,
  ): Promise<void> {
    const img = await downloadPartnerImage(imageUrl);
    const media = await this.uploadDirect.execute(
      ctx.sellerUserId,
      {
        buffer: img.buffer,
        originalname: `partner-${ctx.keyName}-update-${Date.now()}.jpg`,
        mimetype: img.mimeType,
        size: img.buffer.length,
      },
      'product_image',
    );

    const current = images.find((i) => i.isPrimary) ?? images[0];

    // clearPrimary → create новой обложки → delete старой (в этом порядке —
    // на секунду существуют обе строки, но primary-флаг никогда не дублируется).
    await this.imagesRepo.clearPrimary(productId);
    await this.imagesRepo.create({
      productId,
      mediaId: media.mediaFileId,
      sortOrder: current?.sortOrder ?? 0,
      isPrimary: true,
    });

    if (current) {
      await this.imagesRepo.delete(productId, current.id);
    }
  }
}
