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
    private readonly sellersRepo: SellersRepository,
    private readonly storesRepo: StoresRepository,
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
    return this.productsRepo.findByStoreId(storeId, { status, globalCategoryId, storeCategoryId });
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

    return product;
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

    return this.variantsRepo.findByProductId(productId);
  }

  @Post('seller/products/:id/variants')
  @UseGuards(JwtAuthGuard)
  async createMyVariant(
    @CurrentUser() user: JwtPayload,
    @Param('id') productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    const storeId = await this.resolveStoreId(user.sub);
    return this.createVariant.execute(productId, storeId, {
      sku: dto.sku,
      priceOverride: dto.priceOverride,
      stockQuantity: dto.stockQuantity,
      isActive: dto.isActive,
      titleOverride: dto.titleOverride,
      optionValueIds: dto.optionValueIds,
    });
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
    return this.updateVariant.execute(variantId, productId, storeId, {
      sku: dto.sku,
      priceOverride: dto.priceOverride,
      stockQuantity: dto.stockQuantity,
      isActive: dto.isActive,
      titleOverride: dto.titleOverride,
    });
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

  // ─── Storefront routes by slug (public) ──────────────────────────────────

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
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    return this.productsRepo.findPublicByStoreId(store.id, { globalCategoryId, storeCategoryId });
  }

  @Get('stores/:slug/products/:id')
  async getStoreProductBySlug(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    const product = await this.productsRepo.findPublicById(id);
    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    if (product.storeId !== store.id) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }

  // ─── Storefront routes (public) ───────────────────────────────────────────

  @Get('storefront/products')
  async listStorefrontProducts(
    @Query('storeId') storeId: string,
    @Query('globalCategoryId') globalCategoryId?: string,
    @Query('storeCategoryId') storeCategoryId?: string,
  ) {
    if (!storeId) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'storeId query parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.productsRepo.findPublicByStoreId(storeId, { globalCategoryId, storeCategoryId });
  }

  @Get('storefront/products/:id')
  async getStorefrontProduct(@Param('id') id: string) {
    const product = await this.productsRepo.findPublicById(id);

    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }

    return product;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

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
