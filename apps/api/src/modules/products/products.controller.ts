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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { ProductStatus } from '@prisma/client';

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
  ) {}

  // ─── Seller routes ────────────────────────────────────────────────────────

  @Get('seller/products')
  @UseGuards(JwtAuthGuard)
  async listMyProducts(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: ProductStatus,
    @Query('globalCategoryId') globalCategoryId?: string,
    @Query('storeCategoryId') storeCategoryId?: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    const products = await this.productsRepo.findByStoreId(storeId, { status, globalCategoryId, storeCategoryId });
    return (products as unknown as Array<Record<string, unknown> & { _count?: { variants?: number } }>).map((p) => {
      const { _count, ...rest } = p;
      return { ...rest, variantCount: _count?.variants ?? 0 };
    });
  }

  @Post('seller/products')
  @UseGuards(JwtAuthGuard)
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
    });
  }

  @Get('seller/products/:id')
  @UseGuards(JwtAuthGuard)
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

    const p = product as unknown as Record<string, unknown> & { variants?: unknown[] };
    return { ...p, variants: (p.variants ?? []).map((v) => this.normalizeVariant(v)) };
  }

  @Patch('seller/products/:id')
  @UseGuards(JwtAuthGuard)
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
    });
  }

  @Delete('seller/products/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyProduct(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    await this.deleteProduct.execute(id, storeId);
  }

  @Patch('seller/products/:id/status')
  @UseGuards(JwtAuthGuard)
  async changeMyProductStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ChangeProductStatusDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    return this.changeProductStatus.execute(id, storeId, dto.status);
  }

  @Get('seller/products/:id/variants')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
    return { data: stores };
  }

  @Get('storefront/stores/:slug')
  async getStorefrontStoreBySlug(@Param('slug') slug: string) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    return store;
  }

  @Get('stores/:slug')
  async getStoreBySlug(@Param('slug') slug: string) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    return store;
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
    return (products as unknown as Array<Record<string, unknown> & { images?: Array<{ media: unknown }>; _count?: { variants?: number } }>).map((p) => {
      const { _count, ...rest } = p;
      return {
        ...rest,
        images: (p.images ?? []).map((img) => ({ url: this.resolveImageUrl(img.media) })),
        variantCount: _count?.variants ?? 0,
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
    const p = product as unknown as Record<string, unknown> & { images?: Array<{ media: unknown }>; variants?: unknown[] };
    return {
      ...p,
      mediaUrls: (p.images ?? []).map((img) => this.resolveImageUrl(img.media)),
      variants: (p.variants ?? []).map((v) => this.normalizeVariant(v)),
    };
  }

  // ─── Storefront routes (public) ───────────────────────────────────────────

  @Get('storefront/products')
  async listStorefrontProducts(
    @Query('storeId') storeId: string,
    @Query('globalCategoryId') globalCategoryId?: string,
    @Query('storeCategoryId') storeCategoryId?: string,
    @Query('filters') rawFilters?: Record<string, string>,
  ) {
    if (!storeId) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'storeId query parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const attributes = rawFilters && typeof rawFilters === 'object' ? rawFilters : undefined;
    const products = await this.productsRepo.findPublicByStoreId(storeId, { globalCategoryId, storeCategoryId, attributes });
    return (products as unknown as Array<Record<string, unknown> & { images?: Array<{ media: unknown }>; _count?: { variants?: number } }>).map((p) => {
      const { _count, ...rest } = p;
      return {
        ...rest,
        images: (p.images ?? []).map((img) => ({ url: this.resolveImageUrl(img.media) })),
        variantCount: _count?.variants ?? 0,
      };
    });
  }

  @Get('storefront/products/:id')
  async getStorefrontProduct(@Param('id') id: string) {
    const product = await this.productsRepo.findPublicById(id);

    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }

    const p = product as unknown as Record<string, unknown> & { images?: Array<{ media: unknown }>; variants?: unknown[] };
    return {
      ...p,
      mediaUrls: (p.images ?? []).map((img) => this.resolveImageUrl(img.media)),
      variants: (p.variants ?? []).map((v) => this.normalizeVariant(v)),
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private normalizeVariant(variant: unknown): unknown {
    const v = variant as Record<string, unknown>;
    const junctions = (v['optionValues'] ?? []) as Array<{ optionValueId: string }>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { optionValues: _drop, ...rest } = v;
    return { ...rest, optionValueIds: junctions.map((j) => j.optionValueId) };
  }

  private resolveImageUrl(media: unknown): string {
    const m = media as { id?: string; objectKey?: string; bucket?: string } | null | undefined;
    if (!m?.objectKey) return '';
    if (m.bucket === 'telegram') {
      const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');
      return `${appUrl}/api/v1/media/proxy/${m.id}`;
    }
    const r2Base = process.env.STORAGE_PUBLIC_URL ?? '';
    return r2Base ? `${r2Base}/${m.objectKey}` : '';
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
