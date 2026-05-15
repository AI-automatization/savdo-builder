/**
 * Объединённые тесты для wishlist use-cases.
 *
 * Wishlist — простой CRUD, но isAvailable computation в GetWishlist
 * критична: продукт визуально показывается доступным только если его
 * status=ACTIVE && isVisible && store.status=APPROVED && store.isPublic.
 */
import { AddToWishlistUseCase } from './add-to-wishlist.use-case';
import { RemoveFromWishlistUseCase } from './remove-from-wishlist.use-case';
import { GetWishlistUseCase } from './get-wishlist.use-case';
import { WishlistRepository } from '../repositories/wishlist.repository';
import { PrismaService } from '../../../database/prisma.service';

const baseProduct = {
  id: 'p-1',
  title: 'iPhone 16',
  basePrice: 1000,
  currencyCode: 'UZS',
  status: 'ACTIVE',
  isVisible: true,
  storeId: 'store-1',
  displayType: 'SLIDER',
  images: [{ media: { id: 'm-1' } }],
  store: { name: 'My Store', slug: 'my-store', status: 'APPROVED', isPublic: true },
};

describe('AddToWishlistUseCase', () => {
  let useCase: AddToWishlistUseCase;
  let wishlistRepo: { create: jest.Mock };
  let prisma: { product: { findFirst: jest.Mock } };

  // MARKETING-WISHLIST-NOTIFY-001: product now selected with price+status+
  // variants for snapshot. Default mock = ACTIVE+visible+1 in-stock variant.
  const baseProductMock = {
    id: 'p-1',
    basePrice: 100000,
    salePrice: null,
    status: 'ACTIVE',
    isVisible: true,
    variants: [{ stockQuantity: 5 }],
  };

  beforeEach(() => {
    wishlistRepo = { create: jest.fn().mockResolvedValue({ id: 'w-1' }) };
    prisma = { product: { findFirst: jest.fn().mockResolvedValue(baseProductMock) } };
    useCase = new AddToWishlistUseCase(
      wishlistRepo as unknown as WishlistRepository,
      prisma as unknown as PrismaService,
    );
  });

  it('product не найден / soft-deleted → 404', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(useCase.execute('b-1', 'p-missing')).rejects.toThrow(/Product not found/);
    expect(wishlistRepo.create).not.toHaveBeenCalled();
  });

  it('happy path → wishlistRepo.create с snapshot', async () => {
    const result = await useCase.execute('b-1', 'p-1');
    expect(result).toEqual({ id: 'w-1' });
    expect(wishlistRepo.create).toHaveBeenCalledWith('b-1', 'p-1', {
      priceSnapshot: 100000,
      inStockSnapshot: true,
    });
  });

  it('salePrice имеет приоритет над basePrice в priceSnapshot', async () => {
    prisma.product.findFirst.mockResolvedValue({ ...baseProductMock, salePrice: 75000 });
    await useCase.execute('b-1', 'p-1');
    expect(wishlistRepo.create).toHaveBeenCalledWith('b-1', 'p-1', expect.objectContaining({
      priceSnapshot: 75000,
    }));
  });

  it('inStockSnapshot=false если status≠ACTIVE', async () => {
    prisma.product.findFirst.mockResolvedValue({ ...baseProductMock, status: 'DRAFT' });
    await useCase.execute('b-1', 'p-1');
    expect(wishlistRepo.create).toHaveBeenCalledWith('b-1', 'p-1', expect.objectContaining({
      inStockSnapshot: false,
    }));
  });

  it('inStockSnapshot=false если все варианты пусты', async () => {
    prisma.product.findFirst.mockResolvedValue({ ...baseProductMock, variants: [{ stockQuantity: 0 }] });
    await useCase.execute('b-1', 'p-1');
    expect(wishlistRepo.create).toHaveBeenCalledWith('b-1', 'p-1', expect.objectContaining({
      inStockSnapshot: false,
    }));
  });

  it('inStockSnapshot=true если нет вариантов (single-stock product)', async () => {
    prisma.product.findFirst.mockResolvedValue({ ...baseProductMock, variants: [] });
    await useCase.execute('b-1', 'p-1');
    expect(wishlistRepo.create).toHaveBeenCalledWith('b-1', 'p-1', expect.objectContaining({
      inStockSnapshot: true,
    }));
  });

  it('фильтрует soft-deleted (deletedAt IS NULL)', async () => {
    await useCase.execute('b-1', 'p-1');
    expect(prisma.product.findFirst).toHaveBeenCalledWith({
      where: { id: 'p-1', deletedAt: null },
      select: expect.objectContaining({
        id: true,
        basePrice: true,
        salePrice: true,
        status: true,
        isVisible: true,
        variants: expect.any(Object),
      }),
    });
  });
});

describe('RemoveFromWishlistUseCase', () => {
  let useCase: RemoveFromWishlistUseCase;
  let wishlistRepo: { delete: jest.Mock };

  beforeEach(() => {
    wishlistRepo = { delete: jest.fn().mockResolvedValue(undefined) };
    useCase = new RemoveFromWishlistUseCase(wishlistRepo as unknown as WishlistRepository);
  });

  it('делегирует в wishlistRepo.delete', async () => {
    await useCase.execute('b-1', 'p-1');
    expect(wishlistRepo.delete).toHaveBeenCalledWith('b-1', 'p-1');
  });
});

describe('GetWishlistUseCase — isAvailable matrix', () => {
  let useCase: GetWishlistUseCase;
  let wishlistRepo: { findByBuyerId: jest.Mock };
  const resolveImageUrl = jest.fn().mockReturnValue('https://cdn/test.jpg');

  beforeEach(() => {
    wishlistRepo = { findByBuyerId: jest.fn() };
    useCase = new GetWishlistUseCase(wishlistRepo as unknown as WishlistRepository);
  });

  function withProduct(overrides: Partial<typeof baseProduct>) {
    return [{
      id: 'w-1',
      productId: 'p-1',
      createdAt: new Date('2026-01-01'),
      product: { ...baseProduct, ...overrides },
    }];
  }

  it('всё ACTIVE/visible/public → isAvailable=true', async () => {
    wishlistRepo.findByBuyerId.mockResolvedValue(withProduct({}));
    const result = await useCase.execute('b-1', resolveImageUrl);
    expect(result[0].product.isAvailable).toBe(true);
  });

  it('product DRAFT → isAvailable=false', async () => {
    wishlistRepo.findByBuyerId.mockResolvedValue(withProduct({ status: 'DRAFT' }));
    const result = await useCase.execute('b-1', resolveImageUrl);
    expect(result[0].product.isAvailable).toBe(false);
  });

  it('product HIDDEN_BY_ADMIN → isAvailable=false', async () => {
    wishlistRepo.findByBuyerId.mockResolvedValue(withProduct({ status: 'HIDDEN_BY_ADMIN' }));
    const result = await useCase.execute('b-1', resolveImageUrl);
    expect(result[0].product.isAvailable).toBe(false);
  });

  it('isVisible=false → isAvailable=false', async () => {
    wishlistRepo.findByBuyerId.mockResolvedValue(withProduct({ isVisible: false }));
    const result = await useCase.execute('b-1', resolveImageUrl);
    expect(result[0].product.isAvailable).toBe(false);
  });

  it('store SUSPENDED → isAvailable=false', async () => {
    wishlistRepo.findByBuyerId.mockResolvedValue(withProduct({
      store: { ...baseProduct.store, status: 'SUSPENDED' },
    }));
    const result = await useCase.execute('b-1', resolveImageUrl);
    expect(result[0].product.isAvailable).toBe(false);
  });

  it('store isPublic=false → isAvailable=false', async () => {
    wishlistRepo.findByBuyerId.mockResolvedValue(withProduct({
      store: { ...baseProduct.store, isPublic: false },
    }));
    const result = await useCase.execute('b-1', resolveImageUrl);
    expect(result[0].product.isAvailable).toBe(false);
  });

  it('маппит storeName/slug + mediaUrls + Decimal basePrice', async () => {
    wishlistRepo.findByBuyerId.mockResolvedValue(withProduct({}));
    const result = await useCase.execute('b-1', resolveImageUrl);
    expect(result[0]).toEqual({
      id: 'w-1',
      productId: 'p-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      product: expect.objectContaining({
        id: 'p-1',
        title: 'iPhone 16',
        basePrice: 1000,
        currencyCode: 'UZS',
        mediaUrls: ['https://cdn/test.jpg'],
        displayType: 'SLIDER',
        storeId: 'store-1',
        storeName: 'My Store',
        storeSlug: 'my-store',
        isAvailable: true,
      }),
    });
  });

  it('пустые images → mediaUrls = []', async () => {
    wishlistRepo.findByBuyerId.mockResolvedValue(withProduct({ images: [] }));
    const result = await useCase.execute('b-1', resolveImageUrl);
    expect(result[0].product.mediaUrls).toEqual([]);
  });

  it('фильтрует пустые URL (resolveImageUrl возвращает "")', async () => {
    const emptyResolver = jest.fn().mockReturnValue('');
    wishlistRepo.findByBuyerId.mockResolvedValue(withProduct({}));
    const result = await useCase.execute('b-1', emptyResolver);
    expect(result[0].product.mediaUrls).toEqual([]);
  });
});
