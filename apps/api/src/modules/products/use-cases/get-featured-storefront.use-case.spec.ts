/**
 * Тесты для `GetFeaturedStorefrontUseCase` (MARKETING-HOMEPAGE-DISCOVERY-001).
 *
 * Что проверяем:
 *   - возвращает topStores (max 8) + featuredProducts (max 12)
 *   - фильтр: APPROVED + isPublic + не deleted + есть ≥1 ACTIVE product
 *   - products фильтр: ACTIVE + isVisible + не deleted + store APPROVED
 *   - сортировка stores: publishedAt DESC
 *   - сортировка products: avgRating DESC (nulls last) → createdAt DESC
 *   - Decimal price → number; null salePrice/avgRating сохраняется
 *   - mediaUrl через ProductPresenterService
 */
import { GetFeaturedStorefrontUseCase } from './get-featured-storefront.use-case';
import { PrismaService } from '../../../database/prisma.service';
import { ProductPresenterService } from '../services/product-presenter.service';

describe('GetFeaturedStorefrontUseCase', () => {
  let useCase: GetFeaturedStorefrontUseCase;
  let prisma: {
    store: { findMany: jest.Mock };
    product: { findMany: jest.Mock };
  };
  let presenter: {
    resolveStoreImageUrls: jest.Mock;
    resolveImageUrl: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      store: { findMany: jest.fn().mockResolvedValue([]) },
      product: { findMany: jest.fn().mockResolvedValue([]) },
    };
    presenter = {
      resolveStoreImageUrls: jest.fn().mockResolvedValue({ logoUrl: null, coverUrl: null }),
      resolveImageUrl: jest.fn().mockReturnValue(''),
    };
    useCase = new GetFeaturedStorefrontUseCase(
      prisma as unknown as PrismaService,
      presenter as unknown as ProductPresenterService,
    );
  });

  it('empty data → returns {topStores: [], featuredProducts: []}', async () => {
    const result = await useCase.execute();
    expect(result).toEqual({ topStores: [], featuredProducts: [] });
  });

  it('store filter: APPROVED + isPublic + not deleted + has ACTIVE product', async () => {
    await useCase.execute();
    expect(prisma.store.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'APPROVED',
        isPublic: true,
        deletedAt: null,
        products: { some: { status: 'ACTIVE', deletedAt: null } },
      }),
      orderBy: { publishedAt: 'desc' },
      take: 8,
    }));
  });

  it('product filter: ACTIVE + isVisible + not deleted + store APPROVED', async () => {
    await useCase.execute();
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'ACTIVE',
        deletedAt: null,
        isVisible: true,
        store: { status: 'APPROVED', isPublic: true, deletedAt: null },
      }),
      orderBy: [
        { avgRating: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      take: 12,
    }));
  });

  it('topStores mapping: id/slug/name/city + resolved logoUrl/coverUrl', async () => {
    prisma.store.findMany.mockResolvedValue([
      { id: 's-1', slug: 'shop-1', name: 'Shop 1', city: 'Tashkent', logoMediaId: 'm-1', coverMediaId: null },
    ]);
    presenter.resolveStoreImageUrls.mockResolvedValue({ logoUrl: 'https://cdn/logo.jpg', coverUrl: null });

    const result = await useCase.execute();
    expect(result.topStores).toEqual([{
      id: 's-1',
      slug: 'shop-1',
      name: 'Shop 1',
      city: 'Tashkent',
      logoUrl: 'https://cdn/logo.jpg',
      coverUrl: null,
    }]);
    expect(presenter.resolveStoreImageUrls).toHaveBeenCalledWith('m-1', null);
  });

  it('featuredProducts mapping: Decimal→number, salePrice null preserved', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p-1',
        title: 'iPhone',
        basePrice: '1200000',
        salePrice: null,
        currencyCode: 'UZS',
        avgRating: '4.50',
        reviewCount: 12,
        images: [{ media: { id: 'm-1', objectKey: 'p/1.jpg', bucket: 'savdo-public' } }],
        store: { id: 's-1', slug: 'shop', name: 'Shop' },
      },
    ]);
    presenter.resolveImageUrl.mockReturnValue('https://cdn/p/1.jpg');

    const result = await useCase.execute();
    expect(result.featuredProducts[0]).toEqual({
      id: 'p-1',
      title: 'iPhone',
      basePrice: 1200000,
      salePrice: null,
      currencyCode: 'UZS',
      avgRating: 4.5,
      reviewCount: 12,
      mediaUrl: 'https://cdn/p/1.jpg',
      store: { id: 's-1', slug: 'shop', name: 'Shop' },
    });
  });

  it('salePrice present → converted to number', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p-1', title: 'T', basePrice: '100', salePrice: '80', currencyCode: 'UZS',
        avgRating: null, reviewCount: 0, images: [], store: { id: 's', slug: 's', name: 's' },
      },
    ]);
    const result = await useCase.execute();
    expect(result.featuredProducts[0].salePrice).toBe(80);
    expect(result.featuredProducts[0].avgRating).toBeNull();
  });

  it('product без images → mediaUrl=null (resolveImageUrl получает undefined)', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p-1', title: 'T', basePrice: '100', salePrice: null, currencyCode: 'UZS',
        avgRating: null, reviewCount: 0, images: [], store: { id: 's', slug: 's', name: 's' },
      },
    ]);
    presenter.resolveImageUrl.mockReturnValue('');

    const result = await useCase.execute();
    expect(result.featuredProducts[0].mediaUrl).toBeNull();
  });
});
