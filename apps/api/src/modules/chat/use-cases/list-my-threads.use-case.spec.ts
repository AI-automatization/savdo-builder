/**
 * Unit-тест для `ListMyThreadsUseCase`.
 *
 * Покрывает критический контракт после фикса BUG-CHAT-LOAD-001:
 *   новый юзер без Buyer-профиля заходит на /chat/threads → use-case
 *   должен вернуть [], а НЕ бросить 422 BUYER_NOT_IDENTIFIED.
 *
 * До фикса (контроллер 2b2bca7) проверка `if (!input.buyerId) return []`
 * никогда не доходила, потому что resolveBuyerId throw'ил выше. Этот тест
 * закрепляет инвариант на уровне use-case.
 */
import { ConfigService } from '@nestjs/config';
import { ListMyThreadsUseCase } from './list-my-threads.use-case';
import { ChatRepository } from '../repositories/chat.repository';

describe('ListMyThreadsUseCase', () => {
  let useCase: ListMyThreadsUseCase;
  let chatRepo: jest.Mocked<ChatRepository>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    chatRepo = {
      findThreadsByBuyer:  jest.fn(),
      findThreadsBySeller: jest.fn(),
      getUnreadCounts:     jest.fn(),
    } as unknown as jest.Mocked<ChatRepository>;

    config = {
      get: jest.fn().mockReturnValue(true), // features.chatEnabled = true
    } as unknown as jest.Mocked<ConfigService>;

    useCase = new ListMyThreadsUseCase(chatRepo, config);
  });

  describe('chat disabled', () => {
    it('throws SERVICE_UNAVAILABLE если features.chatEnabled=false', async () => {
      (config.get as jest.Mock).mockReturnValue(false);
      await expect(
        useCase.execute({ role: 'BUYER', buyerId: 'any' }),
      ).rejects.toThrow(/Chat is currently disabled/);
    });
  });

  describe('BUYER role — BUG-CHAT-LOAD-001 fix', () => {
    it('возвращает [] если buyerId undefined (новый юзер без Buyer profile)', async () => {
      const result = await useCase.execute({ role: 'BUYER', buyerId: undefined });
      expect(result).toEqual([]);
      expect(chatRepo.findThreadsByBuyer).not.toHaveBeenCalled();
      expect(chatRepo.getUnreadCounts).not.toHaveBeenCalled();
    });

    it('загружает треды если buyerId есть', async () => {
      const fakeThread = {
        id: 'thread-1', threadType: 'PRODUCT', status: 'OPEN',
        lastMessageAt: new Date('2026-05-04T10:00:00Z'),
        messages: [{ body: 'Привет' }],
        product: {
          id: 'p-1',
          title: 'iPhone 15',
          basePrice: 12000000,
          salePrice: null,
          images: [],
        },
        order: null,
        seller: { store: { name: 'Apple Store', slug: 'apple' } },
      };
      chatRepo.findThreadsByBuyer.mockResolvedValueOnce([fakeThread] as never);
      chatRepo.getUnreadCounts.mockResolvedValueOnce(new Map([['thread-1', 3]]) as never);

      const result = await useCase.execute({ role: 'BUYER', buyerId: 'buyer-id-1' });

      expect(chatRepo.findThreadsByBuyer).toHaveBeenCalledWith('buyer-id-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'thread-1',
        unreadCount: 3,
        lastMessage: 'Привет',
        productId: 'p-1',
        productTitle: 'iPhone 15',
        productPrice: 12000000,
        productImageUrl: null,
        storeName: 'Apple Store',
        storeSlug: 'apple',
      });
    });

    // API-CHAT-THREAD-PRODUCT-PREVIEW-001
    it('product preview: salePrice имеет приоритет над basePrice', async () => {
      const fakeThread = {
        id: 'thread-x', threadType: 'PRODUCT', status: 'OPEN',
        lastMessageAt: null, messages: [], order: null,
        seller: { store: null },
        product: {
          id: 'p-2', title: 'Sale item',
          basePrice: 100, salePrice: 80,
          images: [],
        },
      };
      chatRepo.findThreadsByBuyer.mockResolvedValueOnce([fakeThread] as never);
      chatRepo.getUnreadCounts.mockResolvedValueOnce(new Map() as never);

      const result = await useCase.execute({ role: 'BUYER', buyerId: 'b1' });
      expect(result[0].productPrice).toBe(80);
    });

    it('product preview: imageUrl через STORAGE_PUBLIC_URL когда bucket=savdo-public', async () => {
      const prev = process.env.STORAGE_PUBLIC_URL;
      process.env.STORAGE_PUBLIC_URL = 'https://cdn.example.com';
      try {
        const fakeThread = {
          id: 'thread-y', threadType: 'PRODUCT', status: 'OPEN',
          lastMessageAt: null, messages: [], order: null, seller: { store: null },
          product: {
            id: 'p-3', title: 'X', basePrice: 50, salePrice: null,
            images: [{ media: { id: 'm-1', objectKey: 'product/x.jpg', bucket: 'savdo-public' } }],
          },
        };
        chatRepo.findThreadsByBuyer.mockResolvedValueOnce([fakeThread] as never);
        chatRepo.getUnreadCounts.mockResolvedValueOnce(new Map() as never);
        const result = await useCase.execute({ role: 'BUYER', buyerId: 'b1' });
        expect(result[0].productImageUrl).toBe('https://cdn.example.com/product/x.jpg');
      } finally {
        if (prev) process.env.STORAGE_PUBLIC_URL = prev;
        else delete process.env.STORAGE_PUBLIC_URL;
      }
    });

    it('product preview: telegram-expired bucket → imageUrl=null (мёртвый file_id)', async () => {
      const fakeThread = {
        id: 'thread-z', threadType: 'PRODUCT', status: 'OPEN',
        lastMessageAt: null, messages: [], order: null, seller: { store: null },
        product: {
          id: 'p-4', title: 'X', basePrice: 50, salePrice: null,
          images: [{ media: { id: 'm-2', objectKey: 'x', bucket: 'telegram-expired' } }],
        },
      };
      chatRepo.findThreadsByBuyer.mockResolvedValueOnce([fakeThread] as never);
      chatRepo.getUnreadCounts.mockResolvedValueOnce(new Map() as never);
      const result = await useCase.execute({ role: 'BUYER', buyerId: 'b1' });
      expect(result[0].productImageUrl).toBeNull();
    });

    it('ORDER-thread: productId/productTitle/productImageUrl/productPrice все null', async () => {
      const fakeThread = {
        id: 'thread-order', threadType: 'ORDER', status: 'OPEN',
        lastMessageAt: null, messages: [], product: null,
        order: { orderNumber: 'ORD-99' },
        seller: { store: { name: 'S', slug: 's' } },
      };
      chatRepo.findThreadsByBuyer.mockResolvedValueOnce([fakeThread] as never);
      chatRepo.getUnreadCounts.mockResolvedValueOnce(new Map() as never);

      const result = await useCase.execute({ role: 'BUYER', buyerId: 'b1' });
      expect(result[0]).toMatchObject({
        productId: null,
        productTitle: null,
        productImageUrl: null,
        productPrice: null,
        orderNumber: 'ORD-99',
      });
    });
  });

  describe('SELLER role', () => {
    it('возвращает [] если sellerId undefined (магазин ещё не создан)', async () => {
      const result = await useCase.execute({ role: 'SELLER', sellerId: undefined });
      expect(result).toEqual([]);
      expect(chatRepo.findThreadsBySeller).not.toHaveBeenCalled();
    });

    it('загружает треды и нормализует buyerPhone', async () => {
      const fakeThread = {
        id: 'thread-2', threadType: 'ORDER', status: 'OPEN',
        lastMessageAt: null,
        messages: [],
        product: null,
        order: { orderNumber: 'ORD-001' },
        buyer: { user: { phone: '+998901234567' } },
      };
      chatRepo.findThreadsBySeller.mockResolvedValueOnce([fakeThread] as never);
      chatRepo.getUnreadCounts.mockResolvedValueOnce(new Map() as never);

      const result = await useCase.execute({ role: 'SELLER', sellerId: 'seller-id-1' });

      expect(result[0]).toMatchObject({
        id: 'thread-2',
        orderNumber: 'ORD-001',
        buyerPhone: '+998901234567',
        unreadCount: 0,
        lastMessage: null,
      });
    });
  });

  describe('dual-role / ADMIN', () => {
    it('мерджит buyer + seller треды без дубликатов', async () => {
      const buyerThread = {
        id: 'shared-thread', threadType: 'PRODUCT', status: 'OPEN',
        lastMessageAt: new Date('2026-05-04T11:00:00Z'),
        messages: [], product: null, order: null,
        seller: { store: null },
      };
      const sellerThread = { ...buyerThread, buyer: { user: { phone: null } } };

      chatRepo.findThreadsByBuyer.mockResolvedValueOnce([buyerThread] as never);
      chatRepo.findThreadsBySeller.mockResolvedValueOnce([sellerThread] as never);
      chatRepo.getUnreadCounts.mockResolvedValue(new Map() as never);

      const result = await useCase.execute({
        role: 'ADMIN', buyerId: 'b1', sellerId: 's1',
      });

      // Один тред (по id), не два
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('shared-thread');
    });

    it('сортирует треды по lastMessageAt DESC', async () => {
      const oldThread = {
        id: 'old', threadType: 'PRODUCT', status: 'OPEN',
        lastMessageAt: new Date('2026-05-01T10:00:00Z'),
        messages: [], product: null, order: null,
        seller: { store: null },
      };
      const newThread = {
        ...oldThread,
        id: 'new',
        lastMessageAt: new Date('2026-05-04T15:00:00Z'),
      };

      chatRepo.findThreadsByBuyer.mockResolvedValueOnce([oldThread, newThread] as never);
      chatRepo.findThreadsBySeller.mockResolvedValueOnce([] as never);
      chatRepo.getUnreadCounts.mockResolvedValue(new Map() as never);

      const result = await useCase.execute({
        role: 'ADMIN', buyerId: 'b1', sellerId: undefined,
      });

      expect(result.map((t) => t.id)).toEqual(['new', 'old']);
    });
  });
});
