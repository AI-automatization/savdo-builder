/**
 * Тесты для `ChangeProductStatusUseCase`.
 *
 * Product state machine + ownership guard + TG auto-post при публикации.
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
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { PrismaService } from '../../../database/prisma.service';

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
  let telegramBot: {
    sendToChannel: jest.Mock;
    sendPhotoToChannel: jest.Mock;
    sendMediaGroupToChannel: jest.Mock;
  };
  let prisma: {
    store: { findFirst: jest.Mock };
    productImage: { findMany: jest.Mock };
  };

  beforeEach(() => {
    productsRepo = {
      findById: jest.fn().mockResolvedValue(PRODUCT_DRAFT),
      updateStatus: jest.fn().mockImplementation(async (_id, status) => ({
        ...PRODUCT_DRAFT,
        status,
      })),
    };
    telegramBot = {
      sendToChannel: jest.fn().mockResolvedValue(undefined),
      sendPhotoToChannel: jest.fn().mockResolvedValue(undefined),
      sendMediaGroupToChannel: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      store: { findFirst: jest.fn().mockResolvedValue(null) }, // no TG channel
      productImage: { findMany: jest.fn().mockResolvedValue([]) },
    };
    useCase = new ChangeProductStatusUseCase(
      productsRepo as unknown as ProductsRepository,
      telegramBot as unknown as TelegramBotService,
      prisma as unknown as PrismaService,
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
      [ProductStatus.DRAFT,    ProductStatus.ACTIVE],     // публикация
      [ProductStatus.ACTIVE,   ProductStatus.ARCHIVED],   // в архив
      [ProductStatus.ACTIVE,   ProductStatus.DRAFT],      // вернуть в черновик
      [ProductStatus.ARCHIVED, ProductStatus.ACTIVE],     // восстановить из архива
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
      [ProductStatus.DRAFT,    ProductStatus.ARCHIVED], // skip ACTIVE
      [ProductStatus.ARCHIVED, ProductStatus.DRAFT],    // backwards
      [ProductStatus.DRAFT,    ProductStatus.HIDDEN_BY_ADMIN], // не для seller
      [ProductStatus.ACTIVE,   ProductStatus.HIDDEN_BY_ADMIN], // не для seller
    ];

    test.each(forbidden)('%s → %s blocked', async (from, to) => {
      productsRepo.findById.mockResolvedValue({ ...PRODUCT_DRAFT, status: from });
      await expect(useCase.execute('p-1', 'store-1', to))
        .rejects.toThrow(/Cannot transition/);
      expect(productsRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('TG auto-post при публикации', () => {
    it('DRAFT → ACTIVE без telegramChannelId → пропускаем', async () => {
      prisma.store.findFirst.mockResolvedValue({ id: 'store-1', telegramChannelId: null });
      await useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE);
      // ждём микротик чтобы fire-and-forget успел отработать
      await new Promise((r) => setTimeout(r, 0));
      expect(telegramBot.sendToChannel).not.toHaveBeenCalled();
      expect(telegramBot.sendPhotoToChannel).not.toHaveBeenCalled();
    });

    it('DRAFT → ACTIVE с channel + 0 фото → sendToChannel (text only)', async () => {
      prisma.store.findFirst.mockResolvedValue({
        id: 'store-1',
        slug: 'my-store',
        name: 'My Store',
        telegramChannelId: '@my_channel',
        telegramContactLink: null,
      });
      prisma.productImage.findMany.mockResolvedValue([]);
      await useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE);
      await new Promise((r) => setTimeout(r, 0));
      expect(telegramBot.sendToChannel).toHaveBeenCalledTimes(1);
      const [chId, text, buttons] = telegramBot.sendToChannel.mock.calls[0];
      expect(chId).toBe('@my_channel');
      expect(text).toContain('iPhone 16');
      expect(buttons).toHaveLength(2);
    });

    it('1 TG-фото → sendPhotoToChannel', async () => {
      prisma.store.findFirst.mockResolvedValue({
        id: 'store-1', slug: 'my-store', name: 'My Store',
        telegramChannelId: '@my_channel', telegramContactLink: null,
      });
      prisma.productImage.findMany.mockResolvedValue([
        { isPrimary: true, sortOrder: 0, media: { bucket: 'telegram', objectKey: 'tg:FILE_ID_1' } },
      ]);
      await useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE);
      await new Promise((r) => setTimeout(r, 0));
      expect(telegramBot.sendPhotoToChannel).toHaveBeenCalledWith(
        '@my_channel', 'FILE_ID_1', expect.any(String), expect.any(Array), 'HTML',
      );
    });

    it('2+ TG-фото → sendMediaGroupToChannel + текст-кнопки отдельно', async () => {
      prisma.store.findFirst.mockResolvedValue({
        id: 'store-1', slug: 'my-store', name: 'My Store',
        telegramChannelId: '@my_channel', telegramContactLink: null,
      });
      prisma.productImage.findMany.mockResolvedValue([
        { isPrimary: true, sortOrder: 0, media: { bucket: 'telegram', objectKey: 'tg:FILE1' } },
        { isPrimary: false, sortOrder: 1, media: { bucket: 'telegram', objectKey: 'tg:FILE2' } },
      ]);
      await useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE);
      await new Promise((r) => setTimeout(r, 0));
      expect(telegramBot.sendMediaGroupToChannel).toHaveBeenCalledWith(
        '@my_channel', ['FILE1', 'FILE2'], expect.any(String), 'HTML',
      );
      expect(telegramBot.sendToChannel).toHaveBeenCalledTimes(1); // buttons only
    });

    it('R2-фото (bucket != "telegram") отбрасываются', async () => {
      prisma.store.findFirst.mockResolvedValue({
        id: 'store-1', slug: 'my-store', name: 'My Store',
        telegramChannelId: '@my_channel', telegramContactLink: null,
      });
      prisma.productImage.findMany.mockResolvedValue([
        { isPrimary: true, sortOrder: 0, media: { bucket: 'r2', objectKey: 'savdo/123.jpg' } },
      ]);
      await useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE);
      await new Promise((r) => setTimeout(r, 0));
      // 0 TG file ids → fallback на text-only
      expect(telegramBot.sendPhotoToChannel).not.toHaveBeenCalled();
      expect(telegramBot.sendMediaGroupToChannel).not.toHaveBeenCalled();
      expect(telegramBot.sendToChannel).toHaveBeenCalledTimes(1);
    });

    it('ACTIVE → DRAFT (depublish) — НЕ постит в канал', async () => {
      productsRepo.findById.mockResolvedValue({ ...PRODUCT_DRAFT, status: ProductStatus.ACTIVE });
      await useCase.execute('p-1', 'store-1', ProductStatus.DRAFT);
      await new Promise((r) => setTimeout(r, 0));
      expect(prisma.store.findFirst).not.toHaveBeenCalled();
      expect(telegramBot.sendToChannel).not.toHaveBeenCalled();
    });

    it('postToChannel падает → НЕ блокирует ответ (fire-and-forget)', async () => {
      prisma.store.findFirst.mockRejectedValue(new Error('DB down'));
      // Не должно бросать
      await expect(useCase.execute('p-1', 'store-1', ProductStatus.ACTIVE)).resolves.toBeDefined();
    });
  });
});
