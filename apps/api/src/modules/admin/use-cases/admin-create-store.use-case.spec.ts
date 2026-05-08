/**
 * Тесты для `AdminCreateStoreUseCase`.
 * Инварианты: INV-S01 (one store per seller), unique slug, admin bypass
 * (status=ACTIVE + isPublic=true сразу, без DRAFT→review).
 */
import { AdminCreateStoreUseCase } from './admin-create-store.use-case';
import { PrismaService } from '../../../database/prisma.service';

describe('AdminCreateStoreUseCase', () => {
  let useCase: AdminCreateStoreUseCase;
  let prisma: {
    seller: { findUnique: jest.Mock };
    store: { findUnique: jest.Mock; create: jest.Mock };
  };

  const SELLER = { id: 'seller-1', userId: 'u-1', store: null };
  const VALID_INPUT = {
    sellerId: 'seller-1',
    name: 'My Cool Store',
    city: 'Tashkent',
    telegramContactLink: 'https://t.me/x',
  };

  beforeEach(() => {
    prisma = {
      seller: { findUnique: jest.fn().mockResolvedValue(SELLER) },
      store: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'store-1', slug: 'my-cool-store' }),
      },
    };
    useCase = new AdminCreateStoreUseCase(prisma as unknown as PrismaService);
  });

  describe('preconditions', () => {
    it('БРОСАЕТ 404 если seller не найден', async () => {
      prisma.seller.findUnique.mockResolvedValue(null);
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(/Seller not found/);
    });

    it('БРОСАЕТ CONFLICT если у seller уже есть магазин (INV-S01)', async () => {
      prisma.seller.findUnique.mockResolvedValue({ ...SELLER, store: { id: 'existing' } });
      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(/Seller already has a store/);
    });
  });

  describe('slug generation', () => {
    it('slug auto-generated из name (lowercase, dash-separated)', async () => {
      await useCase.execute({ ...VALID_INPUT, name: 'My Cool Store' });
      expect(prisma.store.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'my-cool-store' }) }),
      );
    });

    it('non-ascii символы вычищаются', async () => {
      await useCase.execute({ ...VALID_INPUT, name: 'Магазин "Лучший"!' });
      expect(prisma.store.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'store' }) }),
      );
    });

    it('slug truncates to 60 chars', async () => {
      const long = 'a'.repeat(100);
      await useCase.execute({ ...VALID_INPUT, name: long });
      const call = prisma.store.create.mock.calls[0][0];
      expect(call.data.slug.length).toBeLessThanOrEqual(60);
    });

    it('пустая после санитизации → fallback "store"', async () => {
      await useCase.execute({ ...VALID_INPUT, name: '!!!@#$%' });
      expect(prisma.store.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'store' }) }),
      );
    });

    it('коллизия slug → инкремент: store-1, store-2 etc', async () => {
      prisma.store.findUnique
        .mockResolvedValueOnce({ slug: 'my-store' })   // base taken
        .mockResolvedValueOnce({ slug: 'my-store-1' }) // -1 taken
        .mockResolvedValueOnce(null);                  // -2 free
      await useCase.execute({ ...VALID_INPUT, name: 'My Store' });
      expect(prisma.store.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'my-store-2' }) }),
      );
    });

    it('manual slug — используется как есть если свободен', async () => {
      prisma.store.findUnique.mockResolvedValueOnce(null); // slug check
      await useCase.execute({ ...VALID_INPUT, slug: 'custom-slug' });
      expect(prisma.store.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'custom-slug' }) }),
      );
    });

    it('manual slug → CONFLICT если занят', async () => {
      prisma.store.findUnique.mockResolvedValueOnce({ slug: 'taken' });
      await expect(useCase.execute({ ...VALID_INPUT, slug: 'taken' })).rejects.toThrow(/Slug is already taken/);
      expect(prisma.store.create).not.toHaveBeenCalled();
    });
  });

  describe('admin bypass — skip DRAFT→review flow', () => {
    it('создаёт сразу ACTIVE + isPublic + publishedAt', async () => {
      await useCase.execute(VALID_INPUT);
      expect(prisma.store.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ACTIVE',
            isPublic: true,
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('создаёт deliverySettings nested (default fixed delivery)', async () => {
      await useCase.execute(VALID_INPUT);
      expect(prisma.store.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliverySettings: {
              create: expect.objectContaining({
                supportsDelivery: true,
                supportsPickup: false,
                deliveryFeeType: 'fixed',
              }),
            },
          }),
        }),
      );
    });
  });
});
