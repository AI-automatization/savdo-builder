/**
 * Объединённые тесты для read-only chat use-cases:
 *   - ResolveThread: chatEnabled feature flag, only seller can resolve, idempotent CLOSED
 *   - GetUnreadCount: BUYER vs SELLER, missing profile = empty, summarise threads with c>0
 *   - GetThreadMessages: participant check, hasMore pagination (+1 trick), parent batch resolve
 */
import { ConfigService } from '@nestjs/config';
import { ResolveThreadUseCase } from './resolve-thread.use-case';
import { GetUnreadCountUseCase } from './get-unread-count.use-case';
import { GetThreadMessagesUseCase } from './get-thread-messages.use-case';
import { ChatRepository } from '../repositories/chat.repository';

describe('ResolveThreadUseCase', () => {
  let useCase: ResolveThreadUseCase;
  let chatRepo: { findThreadById: jest.Mock; resolveThread: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    chatRepo = {
      findThreadById: jest.fn().mockResolvedValue({ id: 't-1', sellerId: 'seller-1', status: 'OPEN' }),
      resolveThread: jest.fn().mockResolvedValue({ id: 't-1', status: 'CLOSED' }),
    };
    config = { get: jest.fn().mockReturnValue(true) };
    useCase = new ResolveThreadUseCase(
      chatRepo as unknown as ChatRepository,
      config as unknown as ConfigService,
    );
  });

  it('chatEnabled=false → SERVICE_UNAVAILABLE', async () => {
    config.get.mockReturnValue(false);
    await expect(useCase.execute({ threadId: 't-1', sellerUserId: 'seller-1' }))
      .rejects.toThrow(/Chat is currently disabled/);
  });

  it('thread not found → 404', async () => {
    chatRepo.findThreadById.mockResolvedValue(null);
    await expect(useCase.execute({ threadId: 'missing', sellerUserId: 'seller-1' }))
      .rejects.toThrow(/Thread not found/);
  });

  it('не seller треда → NOT_THREAD_PARTICIPANT', async () => {
    chatRepo.findThreadById.mockResolvedValue({ id: 't-1', sellerId: 'seller-1', status: 'OPEN' });
    await expect(useCase.execute({ threadId: 't-1', sellerUserId: 'seller-OTHER' }))
      .rejects.toThrow(/Only the thread seller can resolve/);
    expect(chatRepo.resolveThread).not.toHaveBeenCalled();
  });

  it('уже CLOSED → idempotent (без resolveThread)', async () => {
    chatRepo.findThreadById.mockResolvedValue({ id: 't-1', sellerId: 'seller-1', status: 'CLOSED' });
    await useCase.execute({ threadId: 't-1', sellerUserId: 'seller-1' });
    expect(chatRepo.resolveThread).not.toHaveBeenCalled();
  });

  it('happy: OPEN → resolveThread → CLOSED', async () => {
    const result = await useCase.execute({ threadId: 't-1', sellerUserId: 'seller-1' });
    expect(chatRepo.resolveThread).toHaveBeenCalledWith('t-1');
    expect(result.status).toBe('CLOSED');
  });
});

describe('GetUnreadCountUseCase', () => {
  let useCase: GetUnreadCountUseCase;
  let chatRepo: {
    findThreadsByBuyer: jest.Mock;
    findThreadsBySeller: jest.Mock;
    getUnreadCounts: jest.Mock;
  };

  beforeEach(() => {
    chatRepo = {
      findThreadsByBuyer: jest.fn().mockResolvedValue([]),
      findThreadsBySeller: jest.fn().mockResolvedValue([]),
      getUnreadCounts: jest.fn().mockResolvedValue(new Map()),
    };
    useCase = new GetUnreadCountUseCase(chatRepo as unknown as ChatRepository);
  });

  it('BUYER без buyerId → empty', async () => {
    const result = await useCase.execute('BUYER', null, 'seller-1');
    expect(result).toEqual({ total: 0, threads: 0 });
    expect(chatRepo.findThreadsByBuyer).not.toHaveBeenCalled();
  });

  it('SELLER без sellerId → empty', async () => {
    const result = await useCase.execute('SELLER', 'buyer-1', null);
    expect(result).toEqual({ total: 0, threads: 0 });
    expect(chatRepo.findThreadsBySeller).not.toHaveBeenCalled();
  });

  it('BUYER с buyerId → findThreadsByBuyer + counts as buyer', async () => {
    chatRepo.findThreadsByBuyer.mockResolvedValue([{ id: 't-1' }, { id: 't-2' }]);
    chatRepo.getUnreadCounts.mockResolvedValue(new Map([['t-1', 5], ['t-2', 3]]));
    const result = await useCase.execute('BUYER', 'buyer-1', undefined);
    expect(chatRepo.findThreadsByBuyer).toHaveBeenCalledWith('buyer-1');
    expect(chatRepo.getUnreadCounts).toHaveBeenCalledWith(expect.any(Array), 'buyer');
    expect(result).toEqual({ total: 8, threads: 2 });
  });

  it('SELLER с sellerId → findThreadsBySeller + counts as seller', async () => {
    chatRepo.findThreadsBySeller.mockResolvedValue([{ id: 't-1' }]);
    chatRepo.getUnreadCounts.mockResolvedValue(new Map([['t-1', 7]]));
    const result = await useCase.execute('SELLER', undefined, 'seller-1');
    expect(chatRepo.findThreadsBySeller).toHaveBeenCalledWith('seller-1');
    expect(chatRepo.getUnreadCounts).toHaveBeenCalledWith(expect.any(Array), 'seller');
    expect(result).toEqual({ total: 7, threads: 1 });
  });

  it('threads с count=0 НЕ считаются (только > 0)', async () => {
    chatRepo.findThreadsByBuyer.mockResolvedValue([{ id: 't-1' }, { id: 't-2' }, { id: 't-3' }]);
    chatRepo.getUnreadCounts.mockResolvedValue(new Map([['t-1', 0], ['t-2', 5], ['t-3', 0]]));
    const result = await useCase.execute('BUYER', 'buyer-1', undefined);
    expect(result).toEqual({ total: 5, threads: 1 });
  });
});

describe('GetThreadMessagesUseCase', () => {
  let useCase: GetThreadMessagesUseCase;
  let chatRepo: {
    findThreadById: jest.Mock;
    findMessages: jest.Mock;
    findMessagesByIds: jest.Mock;
    markAsRead: jest.Mock;
  };
  let config: { get: jest.Mock };

  beforeEach(() => {
    chatRepo = {
      findThreadById: jest.fn().mockResolvedValue({ id: 't-1', buyerId: 'buyer-1', sellerId: 'seller-1' }),
      findMessages: jest.fn().mockResolvedValue([]),
      findMessagesByIds: jest.fn().mockResolvedValue([]),
      markAsRead: jest.fn().mockResolvedValue(undefined),
    };
    config = { get: jest.fn().mockReturnValue(true) };
    useCase = new GetThreadMessagesUseCase(
      chatRepo as unknown as ChatRepository,
      config as unknown as ConfigService,
    );
  });

  it('chatEnabled=false → SERVICE_UNAVAILABLE', async () => {
    config.get.mockReturnValue(false);
    await expect(useCase.execute({ threadId: 't-1', buyerProfileId: 'buyer-1' }))
      .rejects.toThrow(/disabled/);
  });

  it('thread not found → 404', async () => {
    chatRepo.findThreadById.mockResolvedValue(null);
    await expect(useCase.execute({ threadId: 'missing', buyerProfileId: 'buyer-1' }))
      .rejects.toThrow(/Thread not found/);
  });

  it('не участник → NOT_THREAD_PARTICIPANT', async () => {
    await expect(useCase.execute({ threadId: 't-1', buyerProfileId: 'buyer-OTHER' }))
      .rejects.toThrow(/not a participant/);
  });

  it('buyer participant → проходит + markAsRead("buyer") fire-and-forget', async () => {
    await useCase.execute({ threadId: 't-1', buyerProfileId: 'buyer-1' });
    expect(chatRepo.markAsRead).toHaveBeenCalledWith('t-1', 'buyer');
  });

  it('seller participant → markAsRead("seller")', async () => {
    await useCase.execute({ threadId: 't-1', sellerProfileId: 'seller-1' });
    expect(chatRepo.markAsRead).toHaveBeenCalledWith('t-1', 'seller');
  });

  it('hasMore=true когда messages > limit (+1 trick)', async () => {
    const msgs = Array.from({ length: 11 }, (_, i) => ({
      id: `m-${i}`, threadId: 't-1', body: `msg ${i}`, senderUserId: 'buyer-1',
      isDeleted: false, createdAt: new Date(), messageType: 'TEXT',
    }));
    chatRepo.findMessages.mockResolvedValue(msgs);
    const result = await useCase.execute({ threadId: 't-1', buyerProfileId: 'buyer-1', limit: 10 });
    expect(result.hasMore).toBe(true);
    expect(result.messages).toHaveLength(10);
  });

  it('hasMore=false когда messages <= limit', async () => {
    const msgs = Array.from({ length: 5 }, (_, i) => ({
      id: `m-${i}`, threadId: 't-1', body: '', senderUserId: 'buyer-1',
      isDeleted: false, createdAt: new Date(), messageType: 'TEXT',
    }));
    chatRepo.findMessages.mockResolvedValue(msgs);
    const result = await useCase.execute({ threadId: 't-1', buyerProfileId: 'buyer-1', limit: 10 });
    expect(result.hasMore).toBe(false);
    expect(result.messages).toHaveLength(5);
  });

  it('senderRole BUYER если senderUserId === thread.buyerId, иначе SELLER', async () => {
    chatRepo.findMessages.mockResolvedValue([
      { id: 'm-1', threadId: 't-1', body: 'hi', senderUserId: 'buyer-1', isDeleted: false, createdAt: new Date(), messageType: 'TEXT' },
      { id: 'm-2', threadId: 't-1', body: 'reply', senderUserId: 'seller-1', isDeleted: false, createdAt: new Date(), messageType: 'TEXT' },
    ]);
    const result = await useCase.execute({ threadId: 't-1', buyerProfileId: 'buyer-1' });
    expect(result.messages[0].senderRole).toBe('BUYER');
    expect(result.messages[1].senderRole).toBe('SELLER');
  });

  it('isDeleted message → text="" (контент маскируется)', async () => {
    chatRepo.findMessages.mockResolvedValue([
      { id: 'm-1', threadId: 't-1', body: 'leaked secret', senderUserId: 'buyer-1', isDeleted: true, createdAt: new Date(), messageType: 'TEXT' },
    ]);
    const result = await useCase.execute({ threadId: 't-1', buyerProfileId: 'buyer-1' });
    expect(result.messages[0].text).toBe('');
    expect(result.messages[0].isDeleted).toBe(true);
  });

  it('parent message resolved через batch findMessagesByIds (без N+1)', async () => {
    chatRepo.findMessages.mockResolvedValue([
      { id: 'm-1', threadId: 't-1', body: 'reply', senderUserId: 'buyer-1', parentMessageId: 'p-1', isDeleted: false, createdAt: new Date(), messageType: 'TEXT' },
      { id: 'm-2', threadId: 't-1', body: 'reply2', senderUserId: 'buyer-1', parentMessageId: 'p-1', isDeleted: false, createdAt: new Date(), messageType: 'TEXT' },
    ]);
    chatRepo.findMessagesByIds.mockResolvedValue([
      { id: 'p-1', threadId: 't-1', body: 'parent', senderUserId: 'seller-1', isDeleted: false },
    ]);
    const result = await useCase.execute({ threadId: 't-1', buyerProfileId: 'buyer-1' });
    expect(chatRepo.findMessagesByIds).toHaveBeenCalledTimes(1); // batch
    expect(chatRepo.findMessagesByIds).toHaveBeenCalledWith(['p-1']); // dedupe
    expect(result.messages[0].parentMessage).toEqual({
      id: 'p-1',
      text: 'parent',
      senderRole: 'SELLER',
    });
  });
});
