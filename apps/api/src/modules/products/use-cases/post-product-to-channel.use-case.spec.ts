/**
 * Тесты для `PostProductToChannelUseCase` (FEAT-TG-AUTOPOST-001).
 *
 * Покрытие:
 *   - product not found → throws PRODUCT_NOT_FOUND
 *   - store без channelId → no-op {posted: false, reason}
 *   - autoPost=false и force=false → no-op
 *   - force=true game-changes opt-out
 *   - 0 фото → sendToChannel (text-only с button)
 *   - 1 фото с bucket=telegram → sendPhotoToChannel
 *   - 2+ фото → sendMediaGroupToChannel
 *   - bucket=telegram-expired → пропускается
 *   - HTML escape (XSS-style payload в title) → escaped в caption
 *   - sendToChannel throws → fail-tolerant {posted: false, reason}
 */
import { ConfigService } from '@nestjs/config';
import { PostProductToChannelUseCase } from './post-product-to-channel.use-case';
import { PrismaService } from '../../../database/prisma.service';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';

const PRODUCT_BASE = {
  id: 'p-1',
  title: 'iPhone 15 Pro',
  description: 'Latest model',
  basePrice: 12_000_000,
  salePrice: null,
  oldPrice: null,
  currencyCode: 'UZS',
  store: {
    id: 'store-1',
    slug: 'apple-tashkent',
    name: 'Apple Tashkent',
    telegramChannelId: '@apple_tashkent',
    autoPostProductsToChannel: true,
  },
  images: [],
};

describe('PostProductToChannelUseCase', () => {
  let useCase: PostProductToChannelUseCase;
  let prisma: { product: { findUnique: jest.Mock } };
  let telegramBot: {
    sendToChannel: jest.Mock;
    sendPhotoToChannel: jest.Mock;
    sendMediaGroupToChannel: jest.Mock;
  };
  let config: { get: jest.Mock };

  beforeEach(() => {
    prisma = {
      product: { findUnique: jest.fn().mockResolvedValue(PRODUCT_BASE) },
    };
    telegramBot = {
      sendToChannel: jest.fn().mockResolvedValue(undefined),
      sendPhotoToChannel: jest.fn().mockResolvedValue(undefined),
      sendMediaGroupToChannel: jest.fn().mockResolvedValue(undefined),
    };
    config = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'app.buyerUrl') return 'https://savdo.uz';
        return undefined;
      }),
    };
    useCase = new PostProductToChannelUseCase(
      prisma as unknown as PrismaService,
      telegramBot as unknown as TelegramBotService,
      config as unknown as ConfigService,
    );
  });

  it('product не найден → PRODUCT_NOT_FOUND', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(useCase.execute({ productId: 'missing' }))
      .rejects.toThrow(/Product not found/);
  });

  it('store без telegramChannelId → no-op {posted: false}', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...PRODUCT_BASE,
      store: { ...PRODUCT_BASE.store, telegramChannelId: null },
    });
    const result = await useCase.execute({ productId: 'p-1' });
    expect(result.posted).toBe(false);
    expect(result.reason).toMatch(/Channel not configured/);
    expect(telegramBot.sendToChannel).not.toHaveBeenCalled();
  });

  it('autoPost=false без force → no-op', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...PRODUCT_BASE,
      store: { ...PRODUCT_BASE.store, autoPostProductsToChannel: false },
    });
    const result = await useCase.execute({ productId: 'p-1' });
    expect(result.posted).toBe(false);
    expect(result.reason).toMatch(/Auto-post disabled/);
  });

  it('autoPost=false но force=true → постит (manual override)', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...PRODUCT_BASE,
      store: { ...PRODUCT_BASE.store, autoPostProductsToChannel: false },
    });
    const result = await useCase.execute({ productId: 'p-1', force: true });
    expect(result.posted).toBe(true);
    expect(telegramBot.sendToChannel).toHaveBeenCalled();
  });

  describe('media routing', () => {
    it('0 фото → sendToChannel с buttons', async () => {
      await useCase.execute({ productId: 'p-1' });
      expect(telegramBot.sendToChannel).toHaveBeenCalledWith(
        '@apple_tashkent',
        expect.stringContaining('iPhone 15 Pro'),
        expect.arrayContaining([expect.arrayContaining([expect.objectContaining({ text: '🛒 Открыть товар' })])]),
        'HTML',
      );
    });

    it('1 фото bucket=telegram → sendPhotoToChannel', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...PRODUCT_BASE,
        images: [{ media: { id: 'm-1', objectKey: 'tg-file-id-1', bucket: 'telegram' } }],
      });
      await useCase.execute({ productId: 'p-1' });
      expect(telegramBot.sendPhotoToChannel).toHaveBeenCalledWith(
        '@apple_tashkent',
        'tg-file-id-1',
        expect.any(String),
        expect.any(Array),
        'HTML',
      );
    });

    it('2+ фото → sendMediaGroupToChannel (без buttons)', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...PRODUCT_BASE,
        images: [
          { media: { id: 'm-1', objectKey: 'tg-1', bucket: 'telegram' } },
          { media: { id: 'm-2', objectKey: 'tg-2', bucket: 'telegram' } },
          { media: { id: 'm-3', objectKey: 'tg-3', bucket: 'telegram' } },
        ],
      });
      await useCase.execute({ productId: 'p-1' });
      expect(telegramBot.sendMediaGroupToChannel).toHaveBeenCalledWith(
        '@apple_tashkent',
        ['tg-1', 'tg-2', 'tg-3'],
        expect.any(String),
        'HTML',
      );
      expect(telegramBot.sendPhotoToChannel).not.toHaveBeenCalled();
    });

    it('bucket=telegram-expired → пропускается', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...PRODUCT_BASE,
        images: [
          { media: { id: 'm-1', objectKey: 'dead-id', bucket: 'telegram-expired' } },
          { media: { id: 'm-2', objectKey: 'tg-2', bucket: 'telegram' } },
        ],
      });
      await useCase.execute({ productId: 'p-1' });
      // только одно валидное → sendPhotoToChannel
      expect(telegramBot.sendPhotoToChannel).toHaveBeenCalledWith(
        '@apple_tashkent', 'tg-2', expect.any(String), expect.any(Array), 'HTML',
      );
      expect(telegramBot.sendMediaGroupToChannel).not.toHaveBeenCalled();
    });

    it('non-telegram bucket → не используется', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...PRODUCT_BASE,
        images: [
          { media: { id: 'm-1', objectKey: 'r2-key.jpg', bucket: 'savdo-public' } },
        ],
      });
      await useCase.execute({ productId: 'p-1' });
      // 0 telegram fileIds → text-only
      expect(telegramBot.sendToChannel).toHaveBeenCalled();
      expect(telegramBot.sendPhotoToChannel).not.toHaveBeenCalled();
    });
  });

  describe('HTML safety', () => {
    it('XSS payload в title escaped', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...PRODUCT_BASE,
        title: '<script>alert(1)</script>',
        description: '<b>bold</b>',
      });
      await useCase.execute({ productId: 'p-1' });
      const caption = telegramBot.sendToChannel.mock.calls[0][1];
      expect(caption).not.toContain('<script>');
      expect(caption).toContain('&lt;script&gt;');
      expect(caption).toContain('&lt;b&gt;bold&lt;/b&gt;'); // и description тоже escape
    });
  });

  describe('price formatting', () => {
    it('salePrice имеет приоритет, basePrice идёт зачёркнутым', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...PRODUCT_BASE,
        basePrice: 12_000_000,
        salePrice: 9_999_000,
      });
      await useCase.execute({ productId: 'p-1' });
      const caption = telegramBot.sendToChannel.mock.calls[0][1];
      expect(caption).toContain('9');
      expect(caption).toContain('<s>');
    });

    it('basePrice без скидки → одна цена', async () => {
      await useCase.execute({ productId: 'p-1' });
      const caption = telegramBot.sendToChannel.mock.calls[0][1];
      expect(caption).not.toContain('<s>');
    });
  });

  describe('error handling', () => {
    it('Telegram API throws → fail-tolerant {posted:false, reason}', async () => {
      telegramBot.sendToChannel.mockRejectedValue(new Error('TG 429 rate limit'));
      const result = await useCase.execute({ productId: 'p-1' });
      expect(result.posted).toBe(false);
      expect(result.reason).toMatch(/TG 429/);
    });
  });

  describe('product URL', () => {
    it('buyerUrl + slug + productId форматирует ссылку', async () => {
      await useCase.execute({ productId: 'p-1' });
      const buttons = telegramBot.sendToChannel.mock.calls[0][2];
      expect(buttons[0][0].url).toBe('https://savdo.uz/apple-tashkent/products/p-1');
    });
  });
});
