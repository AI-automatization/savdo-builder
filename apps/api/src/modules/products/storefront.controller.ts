import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { HttpStatus } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { ProductsRepository, PublicProductListItem } from './repositories/products.repository';
import { StoresRepository } from '../stores/repositories/stores.repository';
import { WishlistRepository } from '../wishlist/repositories/wishlist.repository';
import { ProductPresenterService } from './services/product-presenter.service';
import { GetFeaturedStorefrontUseCase } from './use-cases/get-featured-storefront.use-case';

/**
 * Optional JWT — анонимные запросы пропускаются (req.user undefined),
 * залогиненные используют для inWishlist enrichment в /storefront/products.
 */
class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: Error, user: TUser): TUser {
    return user;
  }
}

/**
 * StorefrontController — публичные read-only routes витрины.
 *
 * Выделено из products.controller.ts (split Wave 11) — раньше 8 storefront
 * routes жили в одном monolithic ProductsController на 947 LOC. Теперь:
 * - storefront/stores
 * - storefront/stores/:slug
 * - storefront/search (FEAT-001 объединённый поиск)
 * - stores/:slug
 * - stores/:slug/products
 * - stores/:slug/products/:id
 * - storefront/products (с фильтрами + pagination + inWishlist enrichment)
 * - storefront/products/:id
 *
 * Все маппинги через `ProductPresenterService` (shared с seller controller).
 */
@ApiTags('storefront')
@ApiBearerAuth('jwt')
@Controller()
export class StorefrontController {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly storesRepo: StoresRepository,
    private readonly wishlistRepo: WishlistRepository,
    private readonly prisma: PrismaService,
    private readonly presenter: ProductPresenterService,
    private readonly getFeatured: GetFeaturedStorefrontUseCase,
  ) {}

  // ─── MARKETING-HOMEPAGE-DISCOVERY-001: featured feed для cold-traffic ─────

  /**
   * GET /api/v1/storefront/featured
   *
   * Публичный endpoint без auth для homepage. Возвращает `{topStores, featuredProducts}`
   * — разблокирует web-buyer landing (раньше форма ввода slug → 100% bounce).
   *
   * Throttle 60/min — защита от scraping (вышу глобального 120/min baseline).
   */
  @Get('storefront/featured')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getFeaturedStorefront() {
    return this.getFeatured.execute();
  }

  // ─── Stores ──────────────────────────────────────────────────────────────

  @Get('storefront/stores')
  async listStorefrontStores() {
    const stores = await this.storesRepo.findAllPublished();
    if (!stores.length) return { data: [] };
    const data = await this.presenter.attachStoreImageUrls(stores);
    return { data };
  }

  @Get('storefront/stores/:slug')
  async getStorefrontStoreBySlug(@Param('slug') slug: string) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    const s = store as typeof store & { logoMediaId?: string | null; coverMediaId?: string | null };
    const { logoUrl, coverUrl } = await this.presenter.resolveStoreImageUrls(s.logoMediaId, s.coverMediaId);
    return { ...store, logoUrl, coverUrl };
  }

  @Get('stores/:slug')
  async getStoreBySlug(@Param('slug') slug: string) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    const s = store as typeof store & { logoMediaId?: string | null; coverMediaId?: string | null };
    const { logoUrl, coverUrl } = await this.presenter.resolveStoreImageUrls(s.logoMediaId, s.coverMediaId);
    return { ...store, logoUrl, coverUrl };
  }

  // ─── Search ──────────────────────────────────────────────────────────────

  /**
   * FEAT-001: единый поиск — товары + магазины одним запросом.
   * Case-insensitive ILIKE, минимум 2 символа.
   */
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

    const storesData = await this.presenter.attachStoreImageUrls(stores);

    const productsData = products.map((p) => {
      const { basePrice, oldPrice, salePrice, images, store, ...rest } = p;
      return {
        ...rest,
        ...this.presenter.priceFields(basePrice, oldPrice, salePrice),
        images: images.map((img) => ({ url: this.presenter.resolveImageUrl(img.media) })),
        store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
      };
    });

    return { stores: storesData, products: productsData };
  }

  // ─── Products by store slug ──────────────────────────────────────────────

  @Get('stores/:slug/products')
  async listStoreProductsBySlug(
    @Param('slug') slug: string,
    @Query('globalCategoryId') globalCategoryId?: string,
    @Query('storeCategoryId') storeCategoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store || !store.isPublic) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }

    // API-N1-PRODUCTS-LIST-001: opt-in pagination — если фронт передал `page`
    // или `limit`, возвращаем envelope `{ data, meta }`. Иначе legacy raw
    // array до 200 items (backward-compat). Breaking envelope-wide migration
    // отложена в API-PAGINATION-ENVELOPE-001.
    const wantsPagination = page !== undefined || limit !== undefined;

    const mapProduct = (p: PublicProductListItem) => {
      const { _count, variants, basePrice, oldPrice, salePrice, images, ...rest } = p;
      const totalStock = variants.reduce((s, v) => s + (Number(v.stockQuantity) || 0), 0);
      return {
        ...rest,
        ...this.presenter.priceFields(basePrice, oldPrice, salePrice),
        images: images.map((img) => ({ url: this.presenter.resolveImageUrl(img.media) })),
        variantCount: _count.variants,
        totalStock,
      };
    };

    if (wantsPagination) {
      const result = await this.productsRepo.findPublicByStoreIdPaginated(store.id, {
        globalCategoryId,
        storeCategoryId,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });
      return {
        data: result.products.map(mapProduct),
        meta: {
          total: result.total,
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
        },
      };
    }

    // Legacy path — без pagination, take=200 default.
    const products = await this.productsRepo.findPublicByStoreId(store.id, { globalCategoryId, storeCategoryId });
    return products.map(mapProduct);
  }

  @Get('stores/:slug/products/:id')
  async getStoreProductBySlug(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const store = await this.storesRepo.findBySlug(slug);
    if (!store || !store.isPublic) {
      throw new DomainException(ErrorCode.STORE_NOT_FOUND, 'Store not found', HttpStatus.NOT_FOUND);
    }
    const product = await this.productsRepo.findPublicById(id);
    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    if (product.storeId !== store.id) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    // TMA-MEDIA-USE-API-URL-001: вкладываем resolved URL в каждый image.
    const images = product.images.map((img) => ({
      ...img,
      url: this.presenter.resolveImageUrl(img.media),
    }));
    // API-PRODUCT-STORE-TRUST-SIGNALS-001: embed store с trust signals.
    const storeRef = await this.presenter.mapProductStoreRef(product.store);
    return {
      ...product,
      ...this.presenter.priceFields(product.basePrice, product.oldPrice, product.salePrice),
      images,
      mediaUrls: images.map((img) => img.url),
      variants: product.variants.map((v) => this.presenter.normalizeVariant(v)),
      store: storeRef,
    };
  }

  // ─── Storefront products feed ────────────────────────────────────────────

  @Get('storefront/products')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
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
    // FEAT-003: ценовой диапазон. NaN/отрицательные → undefined.
    const parsePrice = (s?: string): number | undefined => {
      if (!s) return undefined;
      const n = Number(s);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    const pMin = parsePrice(priceMin);
    const pMax = parsePrice(priceMax);

    let data: Array<{ id: string; inWishlist?: boolean; [k: string]: unknown }>;
    let total: number;
    let pageNum: number;

    if (!storeId) {
      // Platform-wide feed
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
      data = result.products.map((p) => {
        const { _count, variants, basePrice, oldPrice, salePrice, images, ...rest } = p;
        const totalStock = variants.reduce((s, v) => s + (Number(v.stockQuantity) || 0), 0);
        return {
          ...rest,
          ...this.presenter.priceFields(basePrice, oldPrice, salePrice),
          // API-PRODUCT-LIST-IMAGES-CONTRACT-001: оба поля.
          images: images.map((img) => ({ url: this.presenter.resolveImageUrl(img.media) })),
          mediaUrls: images.map((img) => this.presenter.resolveImageUrl(img.media)),
          variantCount: _count.variants,
          totalStock,
        };
      });
      total = result.total;
      pageNum = page ? parseInt(page, 10) : 1;
    } else {
      // API-N1-PRODUCTS-LIST-001: paginated store-specific feed.
      // Раньше findPublicByStoreId возвращал до 500 products в одном запросе
      // → большие магазины ловили N+1 на includes и медленный TTFB.
      const attributes = rawFilters && typeof rawFilters === 'object' ? rawFilters : undefined;
      const result = await this.productsRepo.findPublicByStoreIdPaginated(storeId, {
        globalCategoryId,
        storeCategoryId,
        attributes,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });
      data = result.products.map((p) => {
        const { _count, variants, basePrice, oldPrice, salePrice, images, ...rest } = p;
        const totalStock = variants.reduce((s, v) => s + (Number(v.stockQuantity) || 0), 0);
        return {
          ...rest,
          ...this.presenter.priceFields(basePrice, oldPrice, salePrice),
          images: images.map((img) => ({ url: this.presenter.resolveImageUrl(img.media) })),
          mediaUrls: images.map((img) => this.presenter.resolveImageUrl(img.media)),
          variantCount: _count.variants,
          totalStock,
        };
      });
      total = result.total;
      pageNum = page ? parseInt(page, 10) : 1;
    }

    // inWishlist enrichment для залогиненного buyer
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

  @Get('storefront/products/:id')
  async getStorefrontProduct(@Param('id') id: string) {
    const product = await this.productsRepo.findPublicById(id);
    if (!product) {
      throw new DomainException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    const images = product.images.map((img) => ({
      ...img,
      url: this.presenter.resolveImageUrl(img.media),
    }));
    // API-PRODUCT-STORE-TRUST-SIGNALS-001: embed store с trust signals.
    const storeRef = await this.presenter.mapProductStoreRef(product.store);
    return {
      ...product,
      ...this.presenter.priceFields(product.basePrice, product.oldPrice, product.salePrice),
      images,
      mediaUrls: images.map((img) => img.url),
      variants: product.variants.map((v) => this.presenter.normalizeVariant(v)),
      store: storeRef,
    };
  }

  private async resolveBuyerIdOrNull(userId: string): Promise<string | null> {
    const buyer = await this.prisma.buyer.findUnique({
      where: { userId },
      select: { id: true },
    });
    return buyer?.id ?? null;
  }
}
