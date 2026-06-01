/**
 * Тесты для `ExpireSubscriptionsUseCase`.
 *
 * Batch cron перевода подписок по lifecycle:
 *   TRIAL    → PAST_DUE   (trialEndsAt < now)        +graceEndsAt = now + GRACE_DAYS
 *   ACTIVE   → PAST_DUE   (currentPeriodEnd < now)   +graceEndsAt = now + GRACE_DAYS
 *   PAST_DUE → SUSPENDED  (graceEndsAt < now)        +suspendedAt = now
 *
 * Покрытие:
 *   - Happy path: все три перехода одновременно → корректные stats + правильные update-payload.
 *   - Идемпотентность: пустые выборки → stats = {0,0,0}, update не вызывается.
 *   - graceEndsAt = now + GRACE_DAYS дней (точная дата).
 *   - Error path: падение в repo.update пробрасывается наружу, последующие подписки в батче не обрабатываются.
 *   - Дефолтный аргумент now = new Date() (вызов без аргументов).
 */
import { ExpireSubscriptionsUseCase } from './expire-subscriptions.use-case';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { GRACE_DAYS } from '../plan-config';

const NOW = new Date('2026-06-01T12:00:00.000Z');
const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;

const TRIAL_SUB = {
  id: 'sub-trial-1',
  sellerId: 'seller-1',
  status: 'TRIAL' as const,
  trialEndsAt: new Date('2026-05-30T00:00:00.000Z'),
};

const ACTIVE_SUB = {
  id: 'sub-active-1',
  sellerId: 'seller-2',
  status: 'ACTIVE' as const,
  currentPeriodEnd: new Date('2026-05-29T00:00:00.000Z'),
};

const PAST_DUE_SUB = {
  id: 'sub-pastdue-1',
  sellerId: 'seller-3',
  status: 'PAST_DUE' as const,
  graceEndsAt: new Date('2026-05-20T00:00:00.000Z'),
};

describe('ExpireSubscriptionsUseCase', () => {
  let useCase: ExpireSubscriptionsUseCase;
  let subscriptionsRepo: {
    findExpiredTrials: jest.Mock;
    findExpiredActive: jest.Mock;
    findExpiredGrace: jest.Mock;
    update: jest.Mock;
  };
  let adminRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    subscriptionsRepo = {
      findExpiredTrials: jest.fn().mockResolvedValue([]),
      findExpiredActive: jest.fn().mockResolvedValue([]),
      findExpiredGrace: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockImplementation(async (id, data) => ({ id, ...data })),
    };
    adminRepo = {};
    const storesRepo = {
      findBySellerId: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    };
    useCase = new ExpireSubscriptionsUseCase(
      subscriptionsRepo as unknown as SubscriptionsRepository,
      adminRepo as unknown as AdminRepository,
      storesRepo as any,
    );
  });

  describe('идемпотентность (пустые выборки)', () => {
    it('нет кандидатов → stats {0,0,0}, update не вызывается', async () => {
      const stats = await useCase.execute(NOW);
      expect(stats).toEqual({ trial: 0, active: 0, suspended: 0 });
      expect(subscriptionsRepo.update).not.toHaveBeenCalled();
    });

    it('repo-методы получают переданный now', async () => {
      await useCase.execute(NOW);
      expect(subscriptionsRepo.findExpiredTrials).toHaveBeenCalledWith(NOW);
      expect(subscriptionsRepo.findExpiredActive).toHaveBeenCalledWith(NOW);
      expect(subscriptionsRepo.findExpiredGrace).toHaveBeenCalledWith(NOW);
    });

    it('вызов без аргументов → now = new Date() (репо получает Date-инстанс)', async () => {
      await useCase.execute();
      const arg = subscriptionsRepo.findExpiredTrials.mock.calls[0][0];
      expect(arg).toBeInstanceOf(Date);
    });
  });

  describe('TRIAL → PAST_DUE', () => {
    it('переводит trial в past_due с graceEndsAt = now + GRACE_DAYS', async () => {
      subscriptionsRepo.findExpiredTrials.mockResolvedValue([TRIAL_SUB]);
      const stats = await useCase.execute(NOW);

      expect(stats.trial).toBe(1);
      expect(subscriptionsRepo.update).toHaveBeenCalledTimes(1);
      expect(subscriptionsRepo.update).toHaveBeenCalledWith(TRIAL_SUB.id, {
        status: 'PAST_DUE',
        graceEndsAt: new Date(NOW.getTime() + GRACE_MS),
      });
    });

    it('батч из нескольких trial — каждый получает свой update', async () => {
      const trial2 = { ...TRIAL_SUB, id: 'sub-trial-2', sellerId: 'seller-x' };
      subscriptionsRepo.findExpiredTrials.mockResolvedValue([TRIAL_SUB, trial2]);

      const stats = await useCase.execute(NOW);

      expect(stats.trial).toBe(2);
      expect(subscriptionsRepo.update).toHaveBeenCalledTimes(2);
      expect(subscriptionsRepo.update).toHaveBeenNthCalledWith(1, TRIAL_SUB.id, expect.any(Object));
      expect(subscriptionsRepo.update).toHaveBeenNthCalledWith(2, trial2.id, expect.any(Object));
    });
  });

  describe('ACTIVE → PAST_DUE', () => {
    it('переводит active в past_due с graceEndsAt = now + GRACE_DAYS', async () => {
      subscriptionsRepo.findExpiredActive.mockResolvedValue([ACTIVE_SUB]);
      const stats = await useCase.execute(NOW);

      expect(stats.active).toBe(1);
      expect(subscriptionsRepo.update).toHaveBeenCalledWith(ACTIVE_SUB.id, {
        status: 'PAST_DUE',
        graceEndsAt: new Date(NOW.getTime() + GRACE_MS),
      });
    });
  });

  describe('PAST_DUE → SUSPENDED', () => {
    it('переводит past_due в suspended с suspendedAt = now', async () => {
      subscriptionsRepo.findExpiredGrace.mockResolvedValue([PAST_DUE_SUB]);
      const stats = await useCase.execute(NOW);

      expect(stats.suspended).toBe(1);
      expect(subscriptionsRepo.update).toHaveBeenCalledWith(PAST_DUE_SUB.id, {
        status: 'SUSPENDED',
        suspendedAt: NOW,
      });
    });
  });

  describe('happy path: смешанный батч (все три перехода одновременно)', () => {
    it('возвращает корректные stats и вызывает update для каждой подписки', async () => {
      subscriptionsRepo.findExpiredTrials.mockResolvedValue([TRIAL_SUB]);
      subscriptionsRepo.findExpiredActive.mockResolvedValue([ACTIVE_SUB]);
      subscriptionsRepo.findExpiredGrace.mockResolvedValue([PAST_DUE_SUB]);

      const stats = await useCase.execute(NOW);

      expect(stats).toEqual({ trial: 1, active: 1, suspended: 1 });
      expect(subscriptionsRepo.update).toHaveBeenCalledTimes(3);
    });
  });

  describe('error path', () => {
    it('падение repo.update пробрасывается наружу', async () => {
      subscriptionsRepo.findExpiredTrials.mockResolvedValue([TRIAL_SUB]);
      subscriptionsRepo.update.mockRejectedValue(new Error('DB connection lost'));

      await expect(useCase.execute(NOW)).rejects.toThrow(/DB connection lost/);
    });

    it('падение на первой подписке батча → последующие не обрабатываются (sequential)', async () => {
      const trial2 = { ...TRIAL_SUB, id: 'sub-trial-2' };
      subscriptionsRepo.findExpiredTrials.mockResolvedValue([TRIAL_SUB, trial2]);
      subscriptionsRepo.update.mockRejectedValueOnce(new Error('boom'));

      await expect(useCase.execute(NOW)).rejects.toThrow(/boom/);
      // вторая подписка не обработана (sequential loop ломается на первой ошибке)
      expect(subscriptionsRepo.update).toHaveBeenCalledTimes(1);
    });

    it('падение findExpired* пробрасывается, update не вызывается', async () => {
      subscriptionsRepo.findExpiredTrials.mockRejectedValue(new Error('query failed'));

      await expect(useCase.execute(NOW)).rejects.toThrow(/query failed/);
      expect(subscriptionsRepo.update).not.toHaveBeenCalled();
    });
  });
});
