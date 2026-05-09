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
import { AuthGuard } from '@nestjs/passport';
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
import { ProductsRepository } from './repositories/products.repository';
import { VariantsRepository } from './repositories/variants.repository';
import { OptionGroupsRepository } from './repositories/option-groups.repository';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { UpdateOptionGroupDto } from './dto/update-option-group.dto';
import { CreateOptionValueDto } from './dto/create-option-value.dto';
import { UpdateOptionValueDto } from './dto/update-option-value.dto';
import { AttachProductImageDto } from './dto/attach-product-image.dto';
import { PrismaService } from '../../database/prisma.service';
import { SellersRepository } from '../sellers/repositories/sellers.repository';
import { StoresRepository } from '../stores/repositories/stores.repository';
import { WishlistRepository } from '../wishlist/repositories/wishlist.repository';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { ProductStatus } from '@prisma/client';

/**
 * Allows storefront feed to be called both anonymously (req.user undefined)
 * and authenticated (req.user populated for inWishlist enrichment).
 */
class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: Error, user: TUser): TUser {
    return user;
  }
}

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
    private readonly productsRepo: ProductsRepository,
    private readonly variantsRepo: VariantsRepository,
    private readonly optionGroupsRepo: OptionGroupsRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly storesRepo: StoresRepository,
    private readonly prisma: PrismaService,
    private readonly wishlistRepo: WishlistRepository,
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
    const storeId = await this.resolveStoreId(user.sub);
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
    const mapped = (products as unknown as Array<Record<string, unknown> & { images?: Array<{ media: unknown }>; variants?: Array<{ stockQuantity: number }>; _count?: { variants?: number } }>).map((p) => {
      const { _count, images, variants, basePrice, oldPrice, salePrice, ...rest } = p;
      const totalStock = (variants ?? []).reduce((s, v) => s + (Number(v.stockQuantity) || 0), 0);
      return {
        ...rest,
        basePrice: Number(basePrice),
        oldPrice: this.toPrice(oldPrice),
        salePrice: this.toPrice(salePrice),
        variantCount: _count?.variants ?? 0,
        totalStock,
        mediaUrls: (images ?? []).map((img) => this.resolveImageUrl(img.media)),
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
    const storeId = await this.resolveStoreId(user.sub);
    const product = await this.productsRepo.findById(id);

    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }

    if (product.storeId !== storeId) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Product does not belong to your store', HttpStatus.FORBIDDEN);
    }

    const p = product as unknown as Record<string, unknown> & { images?: Array<Record<string, unknown> & { media: unknown }>; variants?: unknown[]; basePrice: unknown; oldPrice: unknown; salePrice: unknown };
    // TMA-MEDIA-USE-API-URL-001: вкладываем resolved URL прямо в каждый image,
    // чтобы фронт не зависел от VITE_R2_PUBLIC_URL.
    const images = (p.images ?? []).map((img) => ({
      ...img,
      url: this.resolveImageUrl(img.media),
    }));
    return {
      ...p,
      basePrice: Number(p.basePrice),
      oldPrice: this.toPrice(p.oldPrice),
      salePrice: this.toPrice(p.salePrice),
      images,
      mediaUrls: images.map((img) => img.url),
      variants: (p.variants ?? []).map((v) => this.normalizeVariant(v)),
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

  @Get('seller/products/:id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async listMyVariants(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    const product = await this.productsRepo.findById(productId);

    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }

    if (product.storeId !== storeId) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Product does not belong to your store', HttpStatus.FORBIDDEN);
    }

    const variants = await this.variantsRepo.findByProductId(productId);
    return variants.map((v) => this.normalizeVariant(v));
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
    return this.normalizeVariant(variant);
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
    return this.normalizeVariant(variant);
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
      await this.prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const existingCount = await this.prisma.productImage.count({ where: { productId } });
    const isPrimary = dto.isPrimary ?? existingCount === 0;

    return this.prisma.productImage.create({
      data: {
        productId,
        mediaId: dto.mediaId,
        sortOrder: dto.sortOrder ?? existingCount,
        isPrimary,
      },
      include: { media: true },
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
    await this.prisma.productImage.deleteMany({ where: { id: imageId, productId } });
  }

  // ─── Product Attributes ──────────────────────────────────────────────────

  @Get('seller/products/:id/attributes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async listProductAttributes(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.ensureProductOwnership(productId, storeId);
    return this.prisma.productAttribute.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
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
    return this.prisma.productAttribute.create({
      data: {
        productId,
        name: body.name,
        value: body.value,
        sortOrder: body.sortOrder ?? 0,
      },
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
    return this.prisma.productAttribute.update({
      where: { id: attrId },
      data: { ...body },
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
    await this.prisma.productAttribute.deleteMany({ where: { id: attrId, productId } });
  }

  // ─── Storefront routes (public) ──────────────────────────────────────────

  @Get('storefront/stores')
  async listStorefrontStores() {
    const stores = await this.storesRepo.findAllPublished();
    if (!stores.length) return { data: [] };
    // Тот же helper что и в /storefront/search — batch findMany на все
    // logo/cover IDs (1 запрос вместо N+1).
    const data = await this.attachStoreImageUrls(stores);
    return { data };
  }

  @Get('storefront/stores/:slug')
  async getStorefrontStoreBySlug(@Param('slug') slug: string) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    const s = store as typeof store & { logoMediaId?: string | null; coverMediaId?: string | null };
    const { logoUrl, coverUrl } = await this.resolveStoreImageUrls(s.logoMediaId, s.coverMediaId);
    return { ...store, logoUrl, coverUrl };
  }

  // FEAT-001: единый поиск по витрине — товары + магазины одним запросом.
  // Использует case-insensitive ILIKE по name/title/description; minimum 2 символа
  // (короткие запросы дают слишком много результатов и грузят БД).
  @Get('storefront/search')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async searchStorefront(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    const query = (q ?? '').trim();
    if (query.length < 2) {
      return { stores: [], products: [] };
    }
    const lim = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 30);

    const [stores, products] = await Promise.all([
      this.storesRepo.searchPublic(query, lim),
      this.productsRepo.searchPublic(query, lim),
    ]);

    // Batch lookup: один findMany для всех logo+cover, потом map локально.
    // Раньше resolveStoreImageUrls вызывался per-store -> N запросов на 30 stores.
    const storesData = await this.attachStoreImageUrls(stores);

    const productsData = (products as unknown as Array<Record<string, unknown> & {
      basePrice: unknown; oldPrice: unknown; salePrice: unknown;
      images?: Array<{ media: unknown }>;
      store?: { id: string; name: string; slug: string };
    }>).map((p) => {
      const { basePrice, oldPrice, salePrice, images, store, ...rest } = p;
      return {
        ...rest,
        basePrice: Number(basePrice),
        oldPrice: this.toPrice(oldPrice),
        salePrice: this.toPrice(salePrice),
        images: (images ?? []).map((img) => ({ url: this.resolveImageUrl(img.media) })),
        store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
      };
    });

    return { stores: storesData, products: productsData };
  }

  @Get('stores/:slug')
  async getStoreBySlug(@Param('slug') slug: string) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    const s = store as typeof store & { logoMediaId?: string | null; coverMediaId?: string | null };
    const { logoUrl, coverUrl } = await this.resolveStoreImageUrls(s.logoMediaId, s.coverMediaId);
    return { ...store, logoUrl, coverUrl };
  }

  @Get('stores/:slug/products')
  async listStoreProductsBySlug(
    @Param('slug') slug: string,
    @Query('globalCategoryId') globalCategoryId?: string,
    @Query('storeCategoryId') storeCategoryId?: string,
  ) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store || !(store as any).isPublic) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    const products = await this.productsRepo.findPublicByStoreId(store.id, { globalCategoryId, storeCategoryId });
    return (products as unknown as Array<Record<string, unknown> & { images?: Array<{ media: unknown }>; variants?: Array<{ stockQuantity: number }>; _count?: { variants?: number } }>).map((p) => {
      const { _count, variants, basePrice, oldPrice, salePrice, ...rest } = p;
      const totalStock = (variants ?? []).reduce((s, v) => s + (Number(v.stockQuantity) || 0), 0);
      return {
        ...rest,
        basePrice: Number(basePrice),
        oldPrice: this.toPrice(oldPrice),
        salePrice: this.toPrice(salePrice),
        images: (p.images ?? []).map((img) => ({ url: this.resolveImageUrl(img.media) })),
        variantCount: _count?.variants ?? 0,
        totalStock,
      };
    });
  }

  @Get('stores/:slug/products/:id')
  async getStoreProductBySlug(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store || !(store as any).isPublic) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    const product = await this.productsRepo.findPublicById(id);
    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    if (product.storeId !== store.id) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    const p = product as unknown as Record<string, unknown> & { images?: Array<Record<string, unknown> & { media: unknown }>; variants?: unknown[]; basePrice: unknown; oldPrice: unknown; salePrice: unknown };
    // TMA-MEDIA-USE-API-URL-001: вкладываем resolved URL прямо в каждый image,
    // чтобы фронт не зависел от VITE_R2_PUBLIC_URL.
    const images = (p.images ?? []).map((img) => ({
      ...img,
      url: this.resolveImageUrl(img.media),
    }));
    return {
      ...p,
      basePrice: Number(p.basePrice),
      oldPrice: this.toPrice(p.oldPrice),
      salePrice: this.toPrice(p.salePrice),
      images,
      mediaUrls: images.map((img) => img.url),
      variants: (p.variants ?? []).map((v) => this.normalizeVariant(v)),
    };
  }

  // ─── Storefront routes (public) ───────────────────────────────────────────

  @Get('storefront/products')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 60 } }) // search ILIKE дорогая, ограничиваем
  async listStorefrontProducts(
    @CurrentUser() user: JwtPayload | undefined,
    @Query('storeId') storeId?: string,
    @Query('globalCategoryId') globalCategoryId?: string,
    @Query('storeCategoryId') storeCategoryId?: string,
    @Query('filters') rawFilters?: Record<string, string>,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // FEAT-003: ценовой диапазон. Парсим из query — игнорируем NaN и
    // отрицательные значения (Prisma басимым невалидное число выкинет
    // P2003, лучше превратить в undefined).
    const parsePrice = (s?: string): number | undefined => {
      if (!s) return undefined;
      const n = Number(s);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    const pMin = parsePrice(priceMin);
    const pMax = parsePrice(priceMax);
    // Platform-wide feed (no storeId)
    let data: Array<Record<string, unknown> & { id: string; inWishlist?: boolean }>;
    let total: number;
    let pageNum: number;

    if (!storeId) {
      const validSort = (['new', 'price_asc', 'price_desc'] as const).find((s) => s === sort) ?? 'new';
      const result = await this.productsRepo.findAllPublic({
        q,
        globalCategoryId,
        priceMin: pMin,
        priceMax: pMax,
        sort: validSort,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });
      data = (result.products as unknown as Array<Record<string, unknown> & { id: string; images?: Array<{ media: unknown }>; variants?: Array<{ stockQuantity: number }>; store?: unknown; _count?: { variants?: number } }>).map((p) => {
        const { _count, variants, basePrice, oldPrice, salePrice, ...rest } = p;
        const totalStock = (variants ?? []).reduce((s, v) => s + (Number(v.stockQuantity) || 0), 0);
        return {
          ...rest,
          basePrice: Number(basePrice),
          oldPrice: this.toPrice(oldPrice),
          salePrice: this.toPrice(salePrice),
          // API-PRODUCT-LIST-IMAGES-CONTRACT-001: оба поля.
          images: (p.images ?? []).map((img) => ({ url: this.resolveImageUrl((img as { media: unknown }).media) })),
          mediaUrls: (p.images ?? []).map((img) => this.resolveImageUrl((img as { media: unknown }).media)),
          variantCount: _count?.variants ?? 0,
          totalStock,
        };
      });
      total = result.total;
      pageNum = page ? parseInt(page, 10) : 1;
    } else {
      // Store-specific feed
      const attributes = rawFilters && typeof rawFilters === 'object' ? rawFilters : undefined;
      const products = await this.productsRepo.findPublicByStoreId(storeId, { globalCategoryId, storeCategoryId, attributes });
      data = (products as unknown as Array<Record<string, unknown> & { id: string; images?: Array<{ media: unknown }>; variants?: Array<{ stockQuantity: number }>; _count?: { variants?: number } }>).map((p) => {
        const { _count, variants, basePrice, oldPrice, salePrice, ...rest } = p;
        const totalStock = (variants ?? []).reduce((s, v) => s + (Number(v.stockQuantity) || 0), 0);
        return {
          ...rest,
          basePrice: Number(basePrice),
          oldPrice: this.toPrice(oldPrice),
          salePrice: this.toPrice(salePrice),
          // API-PRODUCT-LIST-IMAGES-CONTRACT-001: возвращаем оба поля для backward
          // compat. `mediaUrls: string[]` — convenience, `images: [{url}]` — canonical
          // (per-image metadata можно расширять).
          images: (p.images ?? []).map((img) => ({ url: this.resolveImageUrl((img as { media: unknown }).media) })),
          mediaUrls: (p.images ?? []).map((img) => this.resolveImageUrl((img as { media: unknown }).media)),
          variantCount: _count?.variants ?? 0,
          totalStock,
        };
      });
      total = data.length;
      pageNum = 1;
    }

    // Enrich with inWishlist flag for authenticated buyer
    if (user?.sub && data.length) {
      const buyerId = await this.resolveBuyerIdOrNull(user.sub);
      if (buyerId) {
        const productIds = data.map((p) => p.id);
        const wishedIds = await this.wishlistRepo.findExistingProductIds(buyerId, productIds);
        for (const item of data) {
          item.inWishlist = wishedIds.has(item.id);
        }
      }
    }

    return { data, meta: { total, page: pageNum } };
  }

  private async resolveBuyerIdOrNull(userId: string): Promise<string | null> {
    const buyer = await this.prisma.buyer.findUnique({
      where: { userId },
      select: { id: true },
    });
    return buyer?.id ?? null;
  }

  @Get('storefront/products/:id')
  async getStorefrontProduct(@Param('id') id: string) {
    const product = await this.productsRepo.findPublicById(id);

    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }

    const p = product as unknown as Record<string, unknown> & { images?: Array<Record<string, unknown> & { media: unknown }>; variants?: unknown[]; basePrice: unknown; oldPrice: unknown; salePrice: unknown };
    // TMA-MEDIA-USE-API-URL-001: вкладываем resolved URL прямо в каждый image,
    // чтобы фронт не зависел от VITE_R2_PUBLIC_URL.
    const images = (p.images ?? []).map((img) => ({
      ...img,
      url: this.resolveImageUrl(img.media),
    }));
    return {
      ...p,
      basePrice: Number(p.basePrice),
      oldPrice: this.toPrice(p.oldPrice),
      salePrice: this.toPrice(p.salePrice),
      images,
      mediaUrls: images.map((img) => img.url),
      variants: (p.variants ?? []).map((v) => this.normalizeVariant(v)),
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private toPrice(val: unknown): number | null {
    if (val === null || val === undefined) return null;
    return Number(val);
  }

  private normalizeVariant(variant: unknown): unknown {
    const v = variant as Record<string, unknown>;
    const junctions = (v['optionValues'] ?? []) as Array<{ optionValueId: string }>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { optionValues: _drop, priceOverride, oldPriceOverride, salePriceOverride, ...rest } = v;
    return {
      ...rest,
      priceOverride: this.toPrice(priceOverride),
      oldPriceOverride: this.toPrice(oldPriceOverride),
      salePriceOverride: this.toPrice(salePriceOverride),
      optionValueIds: junctions.map((j) => j.optionValueId),
    };
  }

  private resolveImageUrl(media: unknown): string {
    const m = media as { id?: string; objectKey?: string; bucket?: string } | null | undefined;
    if (!m?.objectKey) return '';
    // API-BUCKET-NAME-CONSISTENCY-001: 'telegram-expired' выставляется migration
    // если TG getFile вернул 404 — fileId мёртв навсегда. Не показываем.
    if (m.bucket === 'telegram-expired') return '';
    const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');
    // Telegram-stored files always proxy (file URLs expire ~1h)
    if (m.bucket === 'telegram') {
      return `${appUrl}/api/v1/media/proxy/${m.id}`;
    }
    // R2: prefer direct public URL; fall back to proxy if STORAGE_PUBLIC_URL is missing
    const r2Base = process.env.STORAGE_PUBLIC_URL ?? '';
    if (r2Base) return `${r2Base}/${m.objectKey}`;
    return m.id && appUrl ? `${appUrl}/api/v1/media/proxy/${m.id}` : '';
  }

  private async resolveStoreImageUrls(
    logoMediaId: string | null | undefined,
    coverMediaId: string | null | undefined,
  ): Promise<{ logoUrl: string | null; coverUrl: string | null }> {
    const ids = [logoMediaId, coverMediaId].filter(Boolean) as string[];
    if (!ids.length) return { logoUrl: null, coverUrl: null };

    const files = await this.prisma.mediaFile.findMany({
      where: { id: { in: ids } },
      select: { id: true, bucket: true, objectKey: true },
    });
    const map = new Map(files.map((f) => [f.id, f]));

    const resolve = (id: string | null | undefined): string | null => {
      if (!id) return null;
      const m = map.get(id);
      if (!m) return null;
      return this.resolveImageUrl(m) || null;
    };

    return { logoUrl: resolve(logoMediaId), coverUrl: resolve(coverMediaId) };
  }

  /**
   * Batch-вариант resolveStoreImageUrls для списка магазинов.
   * Один SELECT на все logoMediaId/coverMediaId вместо per-store вызова
   * (раньше: N stores -> N+1 запросов; теперь: всегда 1 запрос).
   * Возвращает копии объектов с logoUrl/coverUrl, без logoMediaId/coverMediaId
   * (последние внутренние, не должны утекать клиенту).
   */
  private async attachStoreImageUrls<T extends { logoMediaId?: string | null; coverMediaId?: string | null }>(
    stores: T[],
  ): Promise<Array<Omit<T, 'logoMediaId' | 'coverMediaId'> & { logoUrl: string | null; coverUrl: string | null }>> {
    const ids = new Set<string>();
    for (const s of stores) {
      if (s.logoMediaId) ids.add(s.logoMediaId);
      if (s.coverMediaId) ids.add(s.coverMediaId);
    }

    const map = new Map<string, { id: string; bucket: string; objectKey: string }>();
    if (ids.size > 0) {
      const files = await this.prisma.mediaFile.findMany({
        where: { id: { in: [...ids] } },
        select: { id: true, bucket: true, objectKey: true },
      });
      for (const f of files) map.set(f.id, f);
    }

    const resolveOne = (id: string | null | undefined): string | null => {
      if (!id) return null;
      const m = map.get(id);
      if (!m) return null;
      return this.resolveImageUrl(m) || null;
    };

    return stores.map((s) => {
      const { logoMediaId, coverMediaId, ...rest } = s;
      return {
        ...(rest as Omit<T, 'logoMediaId' | 'coverMediaId'>),
        logoUrl: resolveOne(logoMediaId),
        coverUrl: resolveOne(coverMediaId),
      };
    });
  }

  private async ensureProductOwnership(productId: string, storeId: string): Promise<void> {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    if (product.storeId !== storeId) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Product does not belong to your store', HttpStatus.FORBIDDEN);
    }
  }

  private async resolveStoreId(userId: string): Promise<string> {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }

    const store = await this.storesRepo.findBySellerId(seller.id);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    return store.id;
  }
}
