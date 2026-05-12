/**
 * Тесты для `PostProductToChannelUseCase` (FEAT-TG-AUTOPOST-001 + CHANNEL-PHOTO-001).
 *
 * Покрытие:
 *   - product not found → throws PRODUCT_NOT_FOUND
 *   - store без channelId → no-op {posted: false, reason}
 *   - autoPost=false и force=false → no-op
 *   - force=true override opt-out
 *   - 0 фото → sendToChannel (text-only с button)
 *   - 1 фото → sendPhotoToChannel + caches photoFileId
 *   - 2+ фото → sendMediaGroupToChannel + caches photoFileIds для каждого
 *   - резолвер вернул null (telegram-expired) → фото пропускается
 *   - HTML escape (XSS-style payload в title) → escaped в caption
 *   - sendToChannel throws → fail-tolerant {posted: false, reason}
 *   - дефолтный шаблон содержит availability и contact
 */
import { ConfigService } from '@nestjs/config';
import { PostProductToChannelUseCase } from './post-product-to-channel.use-case';
import { PrismaService } from '../../../database/prisma.service';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { ChannelTemplateService } from '../services/channel-template.service';
import { ChannelMediaResolverService } from '../services/channel-media-resolver.service';

const STORE_BASE = {
  id: 'store-1',
  slug: 'apple-tashkent',
  name: 'Apple Tashkent',
  telegramChannelId: '@apple_tashkent',
  telegramContactLink: '@apple_admin',
  autoPostProductsToChannel: true,
  channelPostTemplate: null,
  channelContactPhone: null,
  channelInstagramLink: null,
  channelTiktokLink: null,
};

const PRODUCT_BASE = {
  id: 'p-1',
  title: 'iPhone 15 Pro',
  description: 'Latest model',
  basePrice: 12_000_000,
  salePrice: null,
  oldPrice: null,
  currencyCode: 'UZS',
  totalStock: 5,
  store: STORE_BASE,
  images: [] as Array<{ media: { id: string; objectKey: string; bucket: string; photoFileId: string | null } | null }>,
  attributes: [] as Array<{ name: string; value: string }>,
  variants: [] as Array<{ title: string | null }>,
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
  let mediaResolver: {
    resolveForChannelSend: jest.Mock;
    cachePhotoFileId: jest.Mock;
  };
  const templateService = new ChannelTemplateService();

  beforeEach(() => {
    prisma = {
      product: { findUnique: jest.fn().mockResolvedValue(structuredClone(PRODUCT_BASE)) },
    };
    telegramBot = {
      sendToChannel: jest.fn().mockResolvedValue(undefined),
      sendPhotoToChannel: jest.fn().mockResolvedValue('photo-fid-1'),
      sendMediaGroupToChannel: jest.fn().mockResolvedValue(['photo-fid-1', 'photo-fid-2']),
    };
    config = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'app.buyerUrl') return 'https://savdo.uz';
        return undefined;
      }),
    };
    mediaResolver = {
      resolveForChannelSend: jest.fn().mockImplementation(async (m: { objectKey: string }) => m.objectKey),
      cachePhotoFileId: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new PostProductToChannelUseCase(
      prisma as unknown as PrismaService,
      telegramBot as unknown as TelegramBotService,
      config as unknown as ConfigService,
      templateService,
      mediaResolver as unknown as ChannelMediaResolverService,
    );
  });

  it('product не найден → PRODUCT_NOT_FOUND', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(useCase.execute({ productId: 'missing' }))
      .rejects.toThrow(/Product not found/);
  });

  it('store без telegramChannelId → no-op {posted: false}', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...structuredClone(PRODUCT_BASE),
      store: { ...STORE_BASE, telegramChannelId: null },
    });
    const result = await useCase.execute({ productId: 'p-1' });
    expect(result.posted).toBe(false);
    expect(result.reason).toMatch(/Channel not configured/);
    expect(telegramBot.sendToChannel).not.toHaveBeenCalled();
  });

  it('autoPost=false без force → no-op', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...structuredClone(PRODUCT_BASE),
      store: { ...STORE_BASE, autoPostProductsToChannel: false },
    });
    const result = await useCase.execute({ productId: 'p-1' });
    expect(result.posted).toBe(false);
    expect(result.reason).toMatch(/Auto-post disabled/);
  });

  it('autoPost=false но force=true → постит (manual override)', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...structuredClone(PRODUCT_BASE),
      store: { ...STORE_BASE, autoPostProductsToChannel: false },
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
        expect.arrayContaining([
          expect.arrayContaining([expect.objectContaining({ text: '🛒 Открыть товар' })]),
        ]),
        'HTML',
      );
    });

    it('1 фото → sendPhotoToChannel + кэширует photoFileId', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...structuredClone(PRODUCT_BASE),
        images: [{ media: { id: 'm-1', objectKey: 'tg-1', bucket: 'telegram', photoFileId: null } }],
      });
      await useCase.execute({ productId: 'p-1' });
      expect(telegramBot.sendPhotoToChannel).toHaveBeenCalledWith(
        '@apple_tashkent',
        'tg-1',
        expect.any(String),
        expect.any(Array),
        'HTML',
      );
      expect(mediaResolver.cachePhotoFileId).toHaveBeenCalledWith('m-1', 'photo-fid-1');
    });

    it('2+ фото → sendMediaGroupToChannel + кэширует photoFileId на каждый', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...structuredClone(PRODUCT_BASE),
        images: [
          { media: { id: 'm-1', objectKey: 'tg-1', bucket: 'telegram', photoFileId: null } },
          { media: { id: 'm-2', objectKey: 'tg-2', bucket: 'telegram', photoFileId: null } },
        ],
      });
      await useCase.execute({ productId: 'p-1' });
      expect(telegramBot.sendMediaGroupToChannel).toHaveBeenCalledWith(
        '@apple_tashkent',
        ['tg-1', 'tg-2'],
        expect.any(String),
        'HTML',
      );
      expect(mediaResolver.cachePhotoFileId).toHaveBeenCalledWith('m-1', 'photo-fid-1');
      expect(mediaResolver.cachePhotoFileId).toHaveBeenCalledWith('m-2', 'photo-fid-2');
    });

    it('resolver вернул null (telegram-expired/no key) → фото пропускается', async () => {
      mediaResolver.resolveForChannelSend.mockImplementationOnce(async () => null);
      prisma.product.findUnique.mockResolvedValue({
        ...structuredClone(PRODUCT_BASE),
        images: [
          { media: { id: 'm-1', objectKey: 'dead', bucket: 'telegram-expired', photoFileId: null } },
          { media: { id: 'm-2', objectKey: 'tg-2', bucket: 'telegram', photoFileId: null } },
        ],
      });
      await useCase.execute({ productId: 'p-1' });
      expect(telegramBot.sendPhotoToChannel).toHaveBeenCalledWith(
        '@apple_tashkent', 'tg-2', expect.any(String), expect.any(Array), 'HTML',
      );
      expect(telegramBot.sendMediaGroupToChannel).not.toHaveBeenCalled();
    });
  });

  describe('HTML safety', () => {
    it('XSS payload в title escaped', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...structuredClone(PRODUCT_BASE),
        title: '<script>alert(1)</script>',
        description: '<b>bold</b>',
      });
      await useCase.execute({ productId: 'p-1' });
      const caption = telegramBot.sendToChannel.mock.calls[0][1];
      expect(caption).not.toContain('<script>');
      expect(caption).toContain('&lt;script&gt;');
    });
  });

  describe('default template content', () => {
    it('содержит цену + контакт + availability', async () => {
      await useCase.execute({ productId: 'p-1' });
      const caption = telegramBot.sendToChannel.mock.calls[0][1];
      expect(caption).toContain('Цена');
      expect(caption).toContain('В наличии');
      expect(caption).toContain('@apple_admin'); // contact из telegramContactLink
    });

    it('totalStock=0 → "Под заказ"', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...structuredClone(PRODUCT_BASE),
        totalStock: 0,
      });
      await useCase.execute({ productId: 'p-1' });
      const caption = telegramBot.sendToChannel.mock.calls[0][1];
      expect(caption).toContain('Под заказ');
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
