/**
 * Тесты для `BroadcastUseCase`.
 *
 * TG-broadcast — operations critical (рассылка может задеть тысячи юзеров,
 * накосячить с rate-limit или audience-фильтрами). Покрытие:
 *   - audience filter: all / sellers / buyers
 *   - дедупликация: telegramChatId vs user.telegramId, Set по id
 *   - previewMode → не пишет log, не ставит jobs
 *   - rate limit: jobs[i].opts.delay = i * 34ms
 *   - getHistory limit + ordering
 */
import { BroadcastUseCase, TELEGRAM_JOB_BROADCAST } from './broadcast.use-case';
import { PrismaService } from '../../../database/prisma.service';
import { Queue } from 'bullmq';

describe('BroadcastUseCase', () => {
  let useCase: BroadcastUseCase;
  let prisma: {
    seller: { findMany: jest.Mock };
    buyer: { findMany: jest.Mock };
    broadcastLog: { create: jest.Mock; findMany: jest.Mock };
  };
  let queue: { addBulk: jest.Mock };

  beforeEach(() => {
    prisma = {
      seller: { findMany: jest.fn().mockResolvedValue([]) },
      buyer:  { findMany: jest.fn().mockResolvedValue([]) },
      broadcastLog: {
        create:   jest.fn().mockResolvedValue({ id: 'log-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    queue = { addBulk: jest.fn().mockResolvedValue(undefined) };

    useCase = new BroadcastUseCase(
      prisma as unknown as PrismaService,
      queue as unknown as Queue,
    );
  });

  describe('audience filter', () => {
    it('audience=sellers → only seller.findMany, без buyer', async () => {
      prisma.seller.findMany.mockResolvedValue([
        { telegramChatId: BigInt(111), user: { telegramId: BigInt(999) } },
      ]);
      const result = await useCase.execute({ message: 'hello', adminUserId: 'a-1', audience: 'sellers' });
      expect(prisma.seller.findMany).toHaveBeenCalled();
      expect(prisma.buyer.findMany).not.toHaveBeenCalled();
      expect(result.queued).toBe(1);
    });

    it('audience=buyers → only buyer.findMany', async () => {
      prisma.buyer.findMany.mockResolvedValue([
        { user: { telegramId: BigInt(222) } },
      ]);
      const result = await useCase.execute({ message: 'hello', adminUserId: 'a-1', audience: 'buyers' });
      expect(prisma.buyer.findMany).toHaveBeenCalled();
      expect(prisma.seller.findMany).not.toHaveBeenCalled();
      expect(result.queued).toBe(1);
    });

    it('audience=all (default) → оба', async () => {
      prisma.seller.findMany.mockResolvedValue([{ telegramChatId: BigInt(111), user: { telegramId: null } }]);
      prisma.buyer.findMany.mockResolvedValue([{ user: { telegramId: BigInt(222) } }]);
      const result = await useCase.execute({ message: 'hello', adminUserId: 'a-1' });
      expect(prisma.seller.findMany).toHaveBeenCalled();
      expect(prisma.buyer.findMany).toHaveBeenCalled();
      expect(result.queued).toBe(2);
    });
  });

  describe('chatId resolution + dedup', () => {
    it('seller.telegramChatId предпочитается над user.telegramId', async () => {
      prisma.seller.findMany.mockResolvedValue([
        { telegramChatId: BigInt(111), user: { telegramId: BigInt(999) } },
      ]);
      await useCase.execute({ message: 'hi', adminUserId: 'a-1', audience: 'sellers' });
      const job = queue.addBulk.mock.calls[0][0][0];
      expect(job.data.chatId).toBe('111'); // not '999'
    });

    it('seller без telegramChatId → fallback на user.telegramId', async () => {
      prisma.seller.findMany.mockResolvedValue([
        { telegramChatId: null, user: { telegramId: BigInt(999) } },
      ]);
      await useCase.execute({ message: 'hi', adminUserId: 'a-1', audience: 'sellers' });
      const job = queue.addBulk.mock.calls[0][0][0];
      expect(job.data.chatId).toBe('999');
    });

    it('seller без обоих ID → пропускается (queued += 0)', async () => {
      prisma.seller.findMany.mockResolvedValue([
        { telegramChatId: null, user: { telegramId: null } },
      ]);
      const result = await useCase.execute({ message: 'hi', adminUserId: 'a-1', audience: 'sellers' });
      expect(result.queued).toBe(0);
      expect(queue.addBulk).toHaveBeenCalledWith([]);
    });

    it('дедупликация: тот же chatId у seller и buyer → один job', async () => {
      // Юзер выступает и продавцом, и покупателем — тот же telegramId
      prisma.seller.findMany.mockResolvedValue([
        { telegramChatId: null, user: { telegramId: BigInt(555) } },
      ]);
      prisma.buyer.findMany.mockResolvedValue([
        { user: { telegramId: BigInt(555) } },
      ]);
      const result = await useCase.execute({ message: 'hi', adminUserId: 'a-1' });
      expect(result.queued).toBe(1);
    });
  });

  describe('previewMode', () => {
    it('previewMode=true → НЕ пишет log, НЕ зовёт queue', async () => {
      prisma.seller.findMany.mockResolvedValue([
        { telegramChatId: BigInt(111), user: { telegramId: null } },
      ]);
      const result = await useCase.execute({
        message: 'hi', adminUserId: 'a-1', audience: 'sellers', previewMode: true,
      });
      expect(result).toEqual({ queued: 1, previewMode: true });
      expect(prisma.broadcastLog.create).not.toHaveBeenCalled();
      expect(queue.addBulk).not.toHaveBeenCalled();
    });
  });

  describe('rate limit (34ms между jobs)', () => {
    it('jobs[i].opts.delay = i * 34', async () => {
      prisma.seller.findMany.mockResolvedValue([
        { telegramChatId: BigInt(111), user: { telegramId: null } },
        { telegramChatId: BigInt(222), user: { telegramId: null } },
        { telegramChatId: BigInt(333), user: { telegramId: null } },
      ]);
      await useCase.execute({ message: 'hi', adminUserId: 'a-1', audience: 'sellers' });
      const jobs = queue.addBulk.mock.calls[0][0];
      expect(jobs).toHaveLength(3);
      expect(jobs[0].opts.delay).toBe(0);
      expect(jobs[1].opts.delay).toBe(34);
      expect(jobs[2].opts.delay).toBe(68);
    });

    it('каждый job имеет name=broadcast-message + broadcastLogId', async () => {
      prisma.seller.findMany.mockResolvedValue([
        { telegramChatId: BigInt(111), user: { telegramId: null } },
      ]);
      await useCase.execute({ message: 'hi', adminUserId: 'a-1', audience: 'sellers' });
      const job = queue.addBulk.mock.calls[0][0][0];
      expect(job.name).toBe(TELEGRAM_JOB_BROADCAST);
      expect(job.data).toEqual({ chatId: '111', message: 'hi', broadcastLogId: 'log-1' });
    });
  });

  describe('broadcastLog creation', () => {
    it('пишет log с creator=adminUserId + message', async () => {
      prisma.seller.findMany.mockResolvedValue([
        { telegramChatId: BigInt(111), user: { telegramId: null } },
      ]);
      await useCase.execute({ message: 'big news', adminUserId: 'a-1', audience: 'sellers' });
      expect(prisma.broadcastLog.create).toHaveBeenCalledWith({
        data: { message: 'big news', createdBy: 'a-1' },
      });
    });

    it('возвращает broadcastLogId в результате', async () => {
      prisma.seller.findMany.mockResolvedValue([
        { telegramChatId: BigInt(111), user: { telegramId: null } },
      ]);
      const result = await useCase.execute({ message: 'hi', adminUserId: 'a-1', audience: 'sellers' });
      expect(result.broadcastLogId).toBe('log-1');
      expect(result.previewMode).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('возвращает 50 последних с creator.phone', async () => {
      await useCase.getHistory();
      expect(prisma.broadcastLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: expect.objectContaining({
          creator: { select: { phone: true } },
        }),
      });
    });
  });
});
