import { ProductsRepository } from './products.repository';

// PERF-API-001: контракт limit cap + серверного поиска в списках товаров.
function makePrisma() {
  return {
    product: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

describe('ProductsRepository (PERF-API-001)', () => {
  describe('findByStoreId — seller list', () => {
    it('без limit — take ограничен default 200 (раньше unbounded)', async () => {
      const prisma = makePrisma();
      const repo = new ProductsRepository(prisma as any);
      await repo.findByStoreId('st-1');
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 200 }),
      );
    });

    it('limit=99999 — cap 500', async () => {
      const prisma = makePrisma();
      const repo = new ProductsRepository(prisma as any);
      await repo.findByStoreId('st-1', { limit: 99999 });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 500 }),
      );
    });

    it('search добавляет insensitive contains по title', async () => {
      const prisma = makePrisma();
      const repo = new ProductsRepository(prisma as any);
      await repo.findByStoreId('st-1', { search: '  Кроссовки ' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: 'st-1',
            deletedAt: null,
            title: { contains: 'Кроссовки', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('countByStoreIdFiltered — total совпадает с фильтрами списка', () => {
    it('считает с теми же where что findByStoreId (search)', async () => {
      const prisma = makePrisma();
      const repo = new ProductsRepository(prisma as any);
      await repo.countByStoreIdFiltered('st-1', { search: 'abc' });
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          storeId: 'st-1',
          deletedAt: null,
          title: { contains: 'abc', mode: 'insensitive' },
        }),
      });
    });
  });

  describe('findAll — admin list', () => {
    it('limit клампится хелпером (cap 100), search ищет по title/description', async () => {
      const prisma = makePrisma();
      const repo = new ProductsRepository(prisma as any);
      await repo.findAll({ limit: 5000, search: 'iphone' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'iphone', mode: 'insensitive' } },
              { description: { contains: 'iphone', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('пустой search не добавляет OR', async () => {
      const prisma = makePrisma();
      const repo = new ProductsRepository(prisma as any);
      await repo.findAll({ search: '   ' });
      const arg = prisma.product.findMany.mock.calls[0][0];
      expect(arg.where.OR).toBeUndefined();
    });
  });
});
