/**
 * Объединённые тесты для AdminCreateSeller + AdminCreateStore.
 *
 * Manual seller activation flow (API-MANUAL-SELLER-ACTIVATION-001):
 *   - AdminCreateSeller: user не найден → 404, уже seller → CONFLICT,
 *     happy path → User.role=SELLER + Seller.verificationStatus=VERIFIED
 *   - AdminCreateStore: seller не найден → 404, уже store → CONFLICT (INV-S01),
 *     auto-slug + manual slug taken → CONFLICT, status=ACTIVE (bypass DRAFT)
 */
import { UserRole, SellerVerificationStatus } from '@prisma/client';
import { AdminCreateSellerUseCase } from './admin-create-seller.use-case';
import { AdminCreateStoreUseCase } from './admin-create-store.use-case';
import { PrismaService } from '../../../database/prisma.service';

describe('AdminCreateSellerUseCase', () => {
  let useCase: AdminCreateSellerUseCase;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    seller: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      seller: {
        create: jest.fn().mockResolvedValue({ id: 'seller-1', userId: 'u-1' }),
      },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(prisma)),
    };
    useCase = new AdminCreateSellerUseCase(prisma as unknown as PrismaService);
  });

  it('user не найден → 404', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(useCase.execute({
      userId: 'missing', fullName: 'X', sellerType: 'individual', telegramUsername: 'u',
    })).rejects.toThrow(/User not found/);
  });

  it('user уже seller → CONFLICT', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u-1', seller: { id: 'existing' } });
    await expect(useCase.execute({
      userId: 'u-1', fullName: 'X', sellerType: 'individual', telegramUsername: 'u',
    })).rejects.toThrow(/already has a seller profile/);
  });

  it('happy: создаёт seller VERIFIED + User.role=SELLER', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u-1', seller: null });
    await useCase.execute({
      userId: 'u-1', fullName: 'John', sellerType: 'individual', telegramUsername: 'john',
    });
    expect(prisma.seller.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'u-1',
        fullName: 'John',
        sellerType: 'individual',
        telegramUsername: 'john',
        verificationStatus: SellerVerificationStatus.VERIFIED,
      }),
    }));
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { role: UserRole.SELLER },
    });
  });

  it('business sellerType', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u-1', seller: null });
    await useCase.execute({
      userId: 'u-1', fullName: 'Co LLC', sellerType: 'business', telegramUsername: 'co',
    });
    expect(prisma.seller.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ sellerType: 'business' }),
    }));
  });
});

describe('AdminCreateStoreUseCase', () => {
  let useCase: AdminCreateStoreUseCase;
  let prisma: {
    seller: { findUnique: jest.Mock };
    store: { findUnique: jest.Mock; create: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      seller: { findUnique: jest.fn() },
      store: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'store-1', slug: 'test-store' }),
      },
    };
    useCase = new AdminCreateStoreUseCase(prisma as unknown as PrismaService);
  });

  it('seller не найден → 404', async () => {
    prisma.seller.findUnique.mockResolvedValue(null);
    await expect(useCase.execute({
      sellerId: 'missing', name: 'X', city: 'TSK', telegramContactLink: 'tme/x',
    })).rejects.toThrow(/Seller not found/);
  });

  it('seller уже имеет store → CONFLICT (INV-S01)', async () => {
    prisma.seller.findUnique.mockResolvedValue({ id: 'seller-1', store: { id: 'existing' } });
    await expect(useCase.execute({
      sellerId: 'seller-1', name: 'X', city: 'TSK', telegramContactLink: 'tme/x',
    })).rejects.toThrow(/already has a store/);
  });

  it('manual slug taken → CONFLICT', async () => {
    prisma.seller.findUnique.mockResolvedValue({ id: 'seller-1', store: null });
    prisma.store.findUnique.mockResolvedValue({ id: 'existing-store' });
    await expect(useCase.execute({
      sellerId: 'seller-1', name: 'X', city: 'TSK', telegramContactLink: 'tme/x',
      slug: 'taken-slug',
    })).rejects.toThrow(/Slug is already taken/);
  });

  it('happy auto-slug: status=ACTIVE + isPublic + publishedAt + deliverySettings', async () => {
    prisma.seller.findUnique.mockResolvedValue({ id: 'seller-1', store: null });
    await useCase.execute({
      sellerId: 'seller-1', name: 'My Store', city: 'TSK', telegramContactLink: 'tme/x',
    });
    expect(prisma.store.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        sellerId: 'seller-1',
        name: 'My Store',
        slug: 'my-store',
        status: 'ACTIVE',
        isPublic: true,
        publishedAt: expect.any(Date),
        deliverySettings: expect.objectContaining({
          create: expect.objectContaining({
            supportsDelivery: true,
            supportsPickup: false,
            deliveryFeeType: 'fixed',
          }),
        }),
      }),
    }));
  });

  it('slugify: убирает спец. символы, lowercase', async () => {
    prisma.seller.findUnique.mockResolvedValue({ id: 'seller-1', store: null });
    await useCase.execute({
      sellerId: 'seller-1', name: 'Привет!! World!!', city: 'TSK', telegramContactLink: 'x',
    });
    const slug = prisma.store.create.mock.calls[0][0].data.slug;
    expect(slug).toBe('world');
  });

  it('slug fallback "store" если slugify дал пустую строку', async () => {
    prisma.seller.findUnique.mockResolvedValue({ id: 'seller-1', store: null });
    await useCase.execute({
      sellerId: 'seller-1', name: '!!!!!', city: 'TSK', telegramContactLink: 'x',
    });
    const slug = prisma.store.create.mock.calls[0][0].data.slug;
    expect(slug).toBe('store');
  });

  it('uniqueSlug добавляет суффикс при конфликте', async () => {
    prisma.seller.findUnique.mockResolvedValue({ id: 'seller-1', store: null });
    let calls = 0;
    prisma.store.findUnique.mockImplementation(({ where }: any) => {
      calls++;
      // первая попытка test-store — занят, вторая test-store-1 — свободен
      return calls === 1 ? { id: 'occupied' } : null;
    });
    await useCase.execute({
      sellerId: 'seller-1', name: 'test store', city: 'TSK', telegramContactLink: 'x',
    });
    const slug = prisma.store.create.mock.calls[0][0].data.slug;
    expect(slug).toBe('test-store-1');
  });
});
