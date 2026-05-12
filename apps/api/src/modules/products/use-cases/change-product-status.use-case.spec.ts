/**
 * Тесты для `ChangeProductStatusUseCase`.
 *
 * Product state machine + ownership guard + делегирование автопостинга.
 * Покрытие:
 *   - allowed transitions per docs/V1.1/02_state_machines.md
 *   - HIDDEN_BY_ADMIN — seller заблокирован
 *   - ownership: чужой store → 403
 *   - продукт не найден → 404
 *   - postToChannel: только при → ACTIVE, fire-and-forget (catch swallows)
 */
import { ProductStatus } from '@prisma/client';
import { ChangeProductStatusUseCase } from './change-product-status.use-case';
import { ProductsRepository } from '../repositories/products.repository';
import { PostProductToChannelUseCase } from './post-product-to-channel.use-case';

const PRODUCT_DRAFT = {
  id: 'p-1',
  storeId: 'store-1',
  status: ProductStatus.DRAFT,
  title: 'iPhone 16',
  description: 'Latest model',
  basePrice: 12_000_000,
};

describe('ChangeProductStatusUseCase', () => {
  let useCase: ChangeProductStatusUseCase;
  let productsRepo: { findById: jest.Mock; updateStatus: jest.Mock };
  let postToChannel: { execute: jest.Mock };

  beforeEach(() => {
    productsRepo = {
      findById: jest.fn().mockResolvedValue(PRODUCT_DRAFT),
      updateStatus: jest.fn().mockImplementation(async (_id, status) => ({
        ...PRODUCT_DRAFT,
        status,
      })),
    };
    postToChannel = {
      execute: jest.fn().mockResolvedValue({ posted: true }),
    };
    useCase = new ChangeProductStatusUseCase(
      productsRepo as unknown as ProductsRepository,
      postToChannel as unknown as PostProductToChannelUseCase,
    );
  });

  describe('preconditions', () => {
    it('продукт не найден → 404', async () => {
      productsRepo.findById.mockResolvedValue(null);
      await expect(useCase.execute('p-missing', 'store-1', ProductStatus.ACTIVE))
        .rejects.toThrow(/Product not found/);
    });

    it('продукт чужого магазина → 403', async () => {
      productsRepo.findById.mockResolvedValue({ ...PRODUCT_DRAFT, storeId: 'store-OTHER' });
      await expect(useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE))
        .rejects.toThrow(/does not belong/);
    });

    it('HIDDEN_BY_ADMIN — seller не может изменить', async () => {
      productsRepo.findById.mockResolvedValue({ ...PRODUCT_DRAFT, status: ProductStatus.HIDDEN_BY_ADMIN });
      await expect(useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE))
        .rejects.toThrow(/hidden by admin/);
      expect(productsRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('allowed transitions', () => {
    const allowed: Array<[ProductStatus, ProductStatus]> = [
      [ProductStatus.DRAFT,    ProductStatus.ACTIVE],
      [ProductStatus.ACTIVE,   ProductStatus.ARCHIVED],
      [ProductStatus.ACTIVE,   ProductStatus.DRAFT],
      [ProductStatus.ARCHIVED, ProductStatus.ACTIVE],
    ];

    test.each(allowed)('%s → %s allowed', async (from, to) => {
      productsRepo.findById.mockResolvedValue({ ...PRODUCT_DRAFT, status: from });
      const result = await useCase.execute('p-1', 'store-1', to);
      expect(result.status).toBe(to);
      expect(productsRepo.updateStatus).toHaveBeenCalledWith('p-1', to);
    });
  });

  describe('forbidden transitions', () => {
    const forbidden: Array<[ProductStatus, ProductStatus]> = [
      [ProductStatus.DRAFT,    ProductStatus.ARCHIVED],
      [ProductStatus.ARCHIVED, ProductStatus.DRAFT],
      [ProductStatus.DRAFT,    ProductStatus.HIDDEN_BY_ADMIN],
      [ProductStatus.ACTIVE,   ProductStatus.HIDDEN_BY_ADMIN],
    ];

    test.each(forbidden)('%s → %s blocked', async (from, to) => {
      productsRepo.findById.mockResolvedValue({ ...PRODUCT_DRAFT, status: from });
      await expect(useCase.execute('p-1', 'store-1', to))
        .rejects.toThrow(/Cannot transition/);
      expect(productsRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('TG auto-post — делегирование PostProductToChannelUseCase', () => {
    it('DRAFT → ACTIVE → вызывает postToChannel.execute(productId)', async () => {
      await useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE);
      await new Promise((r) => setTimeout(r, 0));
      expect(postToChannel.execute).toHaveBeenCalledWith({ productId: 'p-1' });
    });

    it('ACTIVE → DRAFT (depublish) — НЕ вызывает postToChannel', async () => {
      productsRepo.findById.mockResolvedValue({ ...PRODUCT_DRAFT, status: ProductStatus.ACTIVE });
      await useCase.execute('p-1', 'store-1', ProductStatus.DRAFT);
      await new Promise((r) => setTimeout(r, 0));
      expect(postToChannel.execute).not.toHaveBeenCalled();
    });

    it('ARCHIVED → ACTIVE — вызывает postToChannel (re-publish)', async () => {
      productsRepo.findById.mockResolvedValue({ ...PRODUCT_DRAFT, status: ProductStatus.ARCHIVED });
      await useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE);
      await new Promise((r) => setTimeout(r, 0));
      expect(postToChannel.execute).toHaveBeenCalledWith({ productId: 'p-1' });
    });

    it('postToChannel падает → НЕ блокирует ответ (fire-and-forget)', async () => {
      postToChannel.execute.mockRejectedValue(new Error('DB down'));
      await expect(useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE))
        .resolves.toBeDefined();
    });
  });
});
