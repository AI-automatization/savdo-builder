import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ChangeProductStatusDto } from './dto/change-product-status.dto';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { UpdateProductUseCase } from './use-cases/update-product.use-case';
import { ChangeProductStatusUseCase } from './use-cases/change-product-status.use-case';
import { DeleteProductUseCase } from './use-cases/delete-product.use-case';
import { CreateVariantUseCase } from './use-cases/create-variant.use-case';
import { UpdateVariantUseCase } from './use-cases/update-variant.use-case';
import { DeleteVariantUseCase } from './use-cases/delete-variant.use-case';
import { AdjustStockUseCase } from './use-cases/adjust-stock.use-case';
import { PostProductToChannelUseCase } from './use-cases/post-product-to-channel.use-case';
import { ProductsRepository } from './repositories/products.repository';
import { VariantsRepository } from './repositories/variants.repository';
import { OptionGroupsRepository } from './repositories/option-groups.repository';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { UpdateOptionGroupDto } from './dto/update-option-group.dto';
import { CreateOptionValueDto } from './dto/create-option-value.dto';
import { UpdateOptionValueDto } from './dto/update-option-value.dto';
import { AttachProductImageDto } from './dto/attach-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImagesRepository } from './repositories/product-images.repository';
import { ProductAttributesRepository } from './repositories/product-attributes.repository';
import { SellersRepository } from '../sellers/repositories/sellers.repository';
import { StoresRepository } from '../stores/repositories/stores.repository';
import { PlanLimitGuardService } from '../../shared/plan-limit-guard.service';
import { WishlistRepository } from '../wishlist/repositories/wishlist.repository';
import { ProductPresenterService } from './services/product-presenter.service';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { assertProductOwnership } from './guards/product-ownership.guard';
import { ProductStatus } from '@prisma/client';

@ApiTags('seller')
@ApiBearerAuth('jwt')
@Controller()
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly changeProductStatus: ChangeProductStatusUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
    private readonly createVariant: CreateVariantUseCase,
    private readonly updateVariant: UpdateVariantUseCase,
    private readonly deleteVariant: DeleteVariantUseCase,
    private readonly adjustStock: AdjustStockUseCase,
    private readonly postToChannel: PostProductToChannelUseCase,
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
    private readonly optionGroupsRepo: OptionGroupsRepository,
    private readonly imagesRepo: ProductImagesRepository,
    private readonly attributesRepo: ProductAttributesRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly storesRepo: StoresRepository,
    private readonly wishlistRepo: WishlistRepository,
    private readonly presenter: ProductPresenterService,
    private readonly planLimitGuard: PlanLimitGuardService,
  ) {}

  // ─── Seller routes ────────────────────────────────────────────────────────

  @Get('seller/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async listMyProducts(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: ProductStatus,
    @Query('globalCategoryId') globalCategoryId?: string,
    @Query('storeCategoryId') storeCategoryId?: string,
    @Query('limit') limit?: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub, { requireActiveSubscription: false });
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const [products, total] = await Promise.all([
      this.productsRepo.findByStoreId(storeId, {
        status,
        globalCategoryId,
        storeCategoryId,
        limit: parsedLimit,
      }),
      this.productsRepo.countByStoreId(storeId),
    ]);
    const mapped = products.map((p) => {
      const { _count, images, variants, basePrice, oldPrice, salePrice, ...rest } = p;
      // BUG-2: единый stock-агрегат (см. ProductPresenterService.computeStockFields).
      // Раньше sum(variants.stockQuantity) → single-SKU товары всегда показывались как OOS.
      const stock = this.presenter.computeStockFields(p, variants);
      return {
        ...rest,
        ...this.presenter.priceFields(basePrice, oldPrice, salePrice),
        variantCount: _count.variants,
        totalStock: stock.totalStock,
        inStock: stock.inStock,
        mediaUrls: images.map((img) => this.presenter.resolveImageUrl(img.media)),
      };
    });
    return { products: mapped, total };
  }

  @Post('seller/products')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Throttle({ default: { ttl: 60_000, limit: 30 } }) // anti-spam при создании товаров
  async createMyProduct(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProductDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    return this.createProduct.execute(storeId, {
      title: dto.title,
      description: dto.description,
      basePrice: dto.basePrice,
      currencyCode: dto.currencyCode,
      globalCategoryId: dto.globalCategoryId,
      storeCategoryId: dto.storeCategoryId,
      isVisible: dto.isVisible,
      sku: dto.sku,
      displayType: dto.displayType,
      attributesJson: dto.attributesJson,
    });
  }

  @Get('seller/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async getMyProduct(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub, { requireActiveSubscription: false });
    const product = await this.productsRepo.findById(id);

    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }

    assertProductOwnership(product, storeId);

    // TMA-MEDIA-USE-API-URL-001: вкладываем resolved URL прямо в каждый image,
    // чтобы фронт не зависел от VITE_R2_PUBLIC_URL.
    const images = product.images.map((img) => ({
      ...img,
      url: this.presenter.resolveImageUrl(img.media),
    }));
    return {
      ...product,
      ...this.presenter.priceFields(product.basePrice, product.oldPrice, product.salePrice),
      images,
      mediaUrls: images.map((img) => img.url),
      variants: product.variants.map((v) => this.presenter.normalizeVariant(v)),
    };
  }

  @Patch('seller/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async updateMyProduct(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    return this.updateProduct.execute(id, storeId, {
      title: dto.title,
      description: dto.description,
      basePrice: dto.basePrice,
      currencyCode: dto.currencyCode,
      globalCategoryId: dto.globalCategoryId,
      storeCategoryId: dto.storeCategoryId,
      isVisible: dto.isVisible,
      sku: dto.sku,
      displayType: dto.displayType,
    });
  }

  @Delete('seller/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyProduct(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.deleteProduct.execute(id, storeId);
  }

  @Patch('seller/products/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async changeMyProductStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ChangeProductStatusDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    return this.changeProductStatus.execute(id, storeId, dto.status);
  }

  /**
   * FEAT-TG-AUTOPOST-001: ручной repost товара в TG-канал. Игнорирует
   * `autoPostProductsToChannel` toggle (force=true) — для re-post после
   * правки описания/фото без изменения статуса. Throttle 5/мин — не
   * злоупотреблять, иначе TG зашлёт shadowban.
   */
  @Post('seller/products/:id/repost-to-channel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async repostMyProductToChannel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    const product = await this.productsRepo.findById(id);
    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    assertProductOwnership(product, storeId);
    return this.postToChannel.execute({ productId: id, force: true });
  }

  @Get('seller/products/:id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async listMyVariants(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub, { requireActiveSubscription: false });
    const product = await this.productsRepo.findById(productId);

    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }

    assertProductOwnership(product, storeId);

    const variants = await this.variantsRepo.findByProductId(productId);
    return variants.map((v) => this.presenter.normalizeVariant(v));
  }

  @Post('seller/products/:id/variants')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async createMyVariant(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    const variant = await this.createVariant.execute(productId, storeId, {
      sku: dto.sku,
      priceOverride: dto.priceOverride,
      stockQuantity: dto.stockQuantity,
      isActive: dto.isActive,
      titleOverride: dto.titleOverride,
      optionValueIds: dto.optionValueIds,
    });
    return this.presenter.normalizeVariant(variant);
  }

  @Patch('seller/products/:id/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async updateMyVariant(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    const variant = await this.updateVariant.execute(variantId, productId, storeId, {
      sku: dto.sku,
      priceOverride: dto.priceOverride,
      stockQuantity: dto.stockQuantity,
      isActive: dto.isActive,
      titleOverride: dto.titleOverride,
    });
    return this.presenter.normalizeVariant(variant);
  }

  @Delete('seller/products/:id/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyVariant(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.deleteVariant.execute(variantId, productId, storeId);
  }

  @Post('seller/products/:id/variants/:variantId/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @HttpCode(HttpStatus.OK)
  async adjustVariantStock(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: AdjustStockDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    return this.adjustStock.execute(variantId, productId, storeId, dto.delta, dto.reason);
  }

  // ─── Option groups ────────────────────────────────────────────────────────

  @Post('seller/products/:id/option-groups')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async createOptionGroup(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Body() dto: CreateOptionGroupDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    return this.optionGroupsRepo.createGroup(productId, {
      name: dto.name,
      code: dto.code,
      sortOrder: dto.sortOrder,
    });
  }

  @Patch('seller/products/:id/option-groups/:gid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async updateOptionGroup(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('gid') gid: string,
    @Body() dto: UpdateOptionGroupDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    const group = await this.optionGroupsRepo.findGroupById(gid);
    if (!group || group.productId !== productId) {
      throw new DomainException(ErrorCode.OPTION_GROUP_NOT_FOUND, 'Option group not found', HttpStatus.NOT_FOUND);
    }
    return this.optionGroupsRepo.updateGroup(gid, { name: dto.name, sortOrder: dto.sortOrder });
  }

  @Delete('seller/products/:id/option-groups/:gid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOptionGroup(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('gid') gid: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    const group = await this.optionGroupsRepo.findGroupById(gid);
    if (!group || group.productId !== productId) {
      throw new DomainException(ErrorCode.OPTION_GROUP_NOT_FOUND, 'Option group not found', HttpStatus.NOT_FOUND);
    }
    await this.optionGroupsRepo.deleteGroup(gid);
  }

  // ─── Option values ────────────────────────────────────────────────────────

  @Post('seller/products/:id/option-groups/:gid/values')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async createOptionValue(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('gid') gid: string,
    @Body() dto: CreateOptionValueDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    const group = await this.optionGroupsRepo.findGroupById(gid);
    if (!group || group.productId !== productId) {
      throw new DomainException(ErrorCode.OPTION_GROUP_NOT_FOUND, 'Option group not found', HttpStatus.NOT_FOUND);
    }
    return this.optionGroupsRepo.createValue(gid, {
      value: dto.value,
      code: dto.code,
      sortOrder: dto.sortOrder,
    });
  }

  @Patch('seller/products/:id/option-groups/:gid/values/:vid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async updateOptionValue(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('gid') gid: string,
    @Param('vid') vid: string,
    @Body() dto: UpdateOptionValueDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    const group = await this.optionGroupsRepo.findGroupById(gid);
    if (!group || group.productId !== productId) {
      throw new DomainException(ErrorCode.OPTION_GROUP_NOT_FOUND, 'Option group not found', HttpStatus.NOT_FOUND);
    }
    const optionValue = await this.optionGroupsRepo.findValueById(vid);
    if (!optionValue || optionValue.optionGroupId !== gid) {
      throw new DomainException(ErrorCode.OPTION_VALUE_NOT_FOUND, 'Option value not found', HttpStatus.NOT_FOUND);
    }
    return this.optionGroupsRepo.updateValue(vid, { value: dto.value, sortOrder: dto.sortOrder });
  }

  @Delete('seller/products/:id/option-groups/:gid/values/:vid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOptionValue(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('gid') gid: string,
    @Param('vid') vid: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    const group = await this.optionGroupsRepo.findGroupById(gid);
    if (!group || group.productId !== productId) {
      throw new DomainException(ErrorCode.OPTION_GROUP_NOT_FOUND, 'Option group not found', HttpStatus.NOT_FOUND);
    }
    const optionValue = await this.optionGroupsRepo.findValueById(vid);
    if (!optionValue || optionValue.optionGroupId !== gid) {
      throw new DomainException(ErrorCode.OPTION_VALUE_NOT_FOUND, 'Option value not found', HttpStatus.NOT_FOUND);
    }
    await this.optionGroupsRepo.deleteValue(vid);
  }

  // ─── Product images ───────────────────────────────────────────────────────

  @Post('seller/products/:id/images')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async attachProductImage(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Body() dto: AttachProductImageDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);

    if (dto.isPrimary) {
      await this.imagesRepo.clearPrimary(productId);
    }

    const existingCount = await this.imagesRepo.countByProductId(productId);
    const isPrimary = dto.isPrimary ?? existingCount === 0;

    return this.imagesRepo.create({
      productId,
      mediaId: dto.mediaId,
      sortOrder: dto.sortOrder ?? existingCount,
      isPrimary,
    });
  }

  @Delete('seller/products/:id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async detachProductImage(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    await this.imagesRepo.delete(productId, imageId);
  }

  // API-PRODUCT-IMAGES-PATCH-001: reorder (`sortOrder`) + toggle обложки
  // (`isPrimary`). Раньше web-seller edit мог только delete+recreate — порядок
  // и primary-флаг при правке терялись.
  @Patch('seller/products/:id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async updateProductImage(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);

    if (dto.sortOrder === undefined && dto.isPrimary === undefined) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'At least one of sortOrder / isPrimary must be provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Фото должно принадлежать этому товару — нельзя править чужое по id.
    const image = await this.imagesRepo.findByProductAndId(productId, imageId);
    if (!image) {
      throw new DomainException(
        ErrorCode.NOT_FOUND,
        'Product image not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Одна обложка на товар: isPrimary=true снимает флаг с остальных.
    if (dto.isPrimary === true) {
      await this.imagesRepo.clearPrimary(productId, imageId);
    }

    return this.imagesRepo.update(imageId, {
      sortOrder: dto.sortOrder,
      isPrimary: dto.isPrimary,
    });
  }

  // ─── Product Attributes ──────────────────────────────────────────────────

  @Get('seller/products/:id/attributes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async listProductAttributes(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub, { requireActiveSubscription: false });
    await this.ensureProductOwnership(productId, storeId);
    return this.attributesRepo.findByProductId(productId);
  }

  @Post('seller/products/:id/attributes')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async addProductAttribute(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Body() body: { name: string; value: string; sortOrder?: number },
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    return this.attributesRepo.create({
      productId,
      name: body.name,
      value: body.value,
      sortOrder: body.sortOrder ?? 0,
    });
  }

  @Patch('seller/products/:id/attributes/:attrId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async updateProductAttribute(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('attrId') attrId: string,
    @Body() body: { name?: string; value?: string; sortOrder?: number },
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    // IDOR-001: verify the attribute belongs to this product (not just any product).
    const attr = await this.attributesRepo.findByProductAndId(productId, attrId);
    if (!attr) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Attribute not found', HttpStatus.NOT_FOUND);
    }
    return this.attributesRepo.update(attrId, {
      name: body.name,
      value: body.value,
      sortOrder: body.sortOrder,
    });
  }

  @Delete('seller/products/:id/attributes/:attrId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProductAttribute(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Param('attrId') attrId: string,
  ): Promise<void> {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    await this.attributesRepo.delete(productId, attrId);
  }

  // ─── Storefront / public routes вынесены в `StorefrontController`
  //    (apps/api/src/modules/products/storefront.controller.ts):
  //    - storefront/stores, storefront/stores/:slug, storefront/search
  //    - stores/:slug, stores/:slug/products, stores/:slug/products/:id
  //    - storefront/products, storefront/products/:id

  // ─── Private helpers ──────────────────────────────────────────────────────
  // toPrice / normalizeVariant / resolveImageUrl / resolveStoreImageUrls /
  // attachStoreImageUrls вынесены в `ProductPresenterService`
  // (apps/api/src/modules/products/services/product-presenter.service.ts).

  private async ensureProductOwnership(productId: string, storeId: string): Promise<void> {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    assertProductOwnership(product, storeId);
  }

  /**
   * Единый seller-access choke-point. Инкапсулирует все гейты доступа:
   *  - ACCESS-001: blocked seller;
   *  - SUSPENDED-ENFORCEMENT-001: приостановленная подписка (только для мутаций).
   *
   * `requireActiveSubscription` (по умолчанию true) гейтит все mutation-роуты
   * (create/update/delete товара, варианты, фото, атрибуты, репост в канал).
   * GET-роуты (чтения) вызывают с `false` — dashboard остаётся read-only при
   * SUSPENDED, а не мёртвым (business-model-v2 §7). Заказы гейтятся отдельно в
   * orders-контроллере (открытый вопрос политики к Азиму).
   */
  private async resolveStoreId(
    userId: string,
    opts: { requireActiveSubscription?: boolean } = {},
  ): Promise<string> {
    const { requireActiveSubscription = true } = opts;
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }

    // ACCESS-001: blocked sellers must not manage products.
    if (seller.isBlocked) {
      throw new DomainException(ErrorCode.SELLER_BLOCKED, 'Seller account is blocked', HttpStatus.FORBIDDEN);
    }

    // SUSPENDED-ENFORCEMENT-001: приостановленный продавец не может менять каталог.
    if (requireActiveSubscription) {
      await this.planLimitGuard.assertActiveSubscription(seller.id);
    }

    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    return store.id;
  }
}
