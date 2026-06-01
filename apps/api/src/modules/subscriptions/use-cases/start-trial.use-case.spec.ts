/**
 * Тесты для `StartTrialUseCase`.
 *
 * Создание TRIAL-подписки при первом обращении seller'а.
 * Idempotent: если подписка уже есть — возвращается существующая (любой статус).
 *
 * Покрытие:
 *   - execute: happy path — создание новой TRIAL подписки с корректными датами
 *   - execute: idempotency — существующая подписка возвращается без create
 *   - execute: idempotency — даже если статус не TRIAL (ACTIVE/CHURNED), возвращаем as-is
 *   - execute: trialEndsAt = now + TRIAL_DAYS * 24h (точная арифметика)
 *   - execute: tier = DEFAULT_TRIAL_TIER, status = 'TRIAL'
 *   - execute: пробрасывает ошибку репозитория при create (DB сбой)
 *   - requireOrStart: возвращает existing если подписка есть
 *   - requireOrStart: делегирует execute если подписки нет
 */
import { StartTrialUseCase } from './start-trial.use-case';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { DEFAULT_TRIAL_TIER, TRIAL_DAYS } from '../plan-config';

const SELLER_ID = 'seller-1';

const EXISTING_TRIAL = {
  id: 'sub-1',
  sellerId: SELLER_ID,
  tier: DEFAULT_TRIAL_TIER,
  status: 'TRIAL' as const,
  trialStartedAt: new Date('2026-05-01T00:00:00.000Z'),
  trialEndsAt: new Date('2026-05-15T00:00:00.000Z'),
  currentPeriodStart: null,
  currentPeriodEnd: null,
  graceEndsAt: null,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
};

describe('StartTrialUseCase', () => {
  let useCase: StartTrialUseCase;
  let subscriptionsRepo: { findBySellerId: jest.Mock; create: jest.Mock };

  beforeEach(() => {
    subscriptionsRepo = {
      findBySellerId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async (data) => ({
        id: 'sub-new',
        ...data,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        graceEndsAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
    useCase = new StartTrialUseCase(
      subscriptionsRepo as unknown as SubscriptionsRepository,
    );
  });

  describe('execute — happy path', () => {
    it('подписки нет → создаёт TRIAL с DEFAULT_TRIAL_TIER и status=TRIAL', async () => {
      const result = await useCase.execute(SELLER_ID);

      expect(subscriptionsRepo.findBySellerId).toHaveBeenCalledWith(SELLER_ID);
      expect(subscriptionsRepo.create).toHaveBeenCalledTimes(1);
      const createArgs = subscriptionsRepo.create.mock.calls[0][0];
      expect(createArgs.sellerId).toBe(SELLER_ID);
      expect(createArgs.tier).toBe(DEFAULT_TRIAL_TIER);
      expect(createArgs.status).toBe('TRIAL');
      expect(createArgs.trialStartedAt).toBeInstanceOf(Date);
      expect(createArgs.trialEndsAt).toBeInstanceOf(Date);
      expect(result.status).toBe('TRIAL');
      expect(result.tier).toBe(DEFAULT_TRIAL_TIER);
    });

    it('trialEndsAt = trialStartedAt + TRIAL_DAYS * 24 * 60 * 60 * 1000', async () => {
      await useCase.execute(SELLER_ID);
      const { trialStartedAt, trialEndsAt } =
        subscriptionsRepo.create.mock.calls[0][0];
      const diffMs = trialEndsAt.getTime() - trialStartedAt.getTime();
      const expectedMs = TRIAL_DAYS * 24 * 60 * 60 * 1000;
      expect(diffMs).toBe(expectedMs);
    });
  });

  describe('execute — idempotency', () => {
    it('подписка TRIAL уже есть → возвращает existing, create НЕ вызывается', async () => {
      subscriptionsRepo.findBySellerId.mockResolvedValue(EXISTING_TRIAL);

      const result = await useCase.execute(SELLER_ID);

      expect(result).toBe(EXISTING_TRIAL);
      expect(subscriptionsRepo.create).not.toHaveBeenCalled();
    });

    it('подписка в статусе ACTIVE → возвращает as-is, create НЕ вызывается', async () => {
      const activeSub = { ...EXISTING_TRIAL, status: 'ACTIVE' as const };
      subscriptionsRepo.findBySellerId.mockResolvedValue(activeSub);

      const result = await useCase.execute(SELLER_ID);

      expect(result).toBe(activeSub);
      expect(subscriptionsRepo.create).not.toHaveBeenCalled();
    });

    it('подписка CHURNED → всё равно возвращается без повторного создания', async () => {
      const churnedSub = { ...EXISTING_TRIAL, status: 'CHURNED' as const };
      subscriptionsRepo.findBySellerId.mockResolvedValue(churnedSub);

      const result = await useCase.execute(SELLER_ID);

      expect(result).toBe(churnedSub);
      expect(subscriptionsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('execute — error paths', () => {
    it('findBySellerId падает → ошибка пробрасывается', async () => {
      subscriptionsRepo.findBySellerId.mockRejectedValue(
        new Error('DB connection lost'),
      );
      await expect(useCase.execute(SELLER_ID)).rejects.toThrow(
        /DB connection lost/,
      );
      expect(subscriptionsRepo.create).not.toHaveBeenCalled();
    });

    it('create падает (например unique constraint) → ошибка пробрасывается', async () => {
      subscriptionsRepo.create.mockRejectedValue(
        new Error('Unique constraint failed on sellerId'),
      );
      await expect(useCase.execute(SELLER_ID)).rejects.toThrow(
        /Unique constraint/,
      );
    });
  });

  describe('requireOrStart', () => {
    it('подписка уже есть → возвращает existing, execute НЕ вызывает create', async () => {
      subscriptionsRepo.findBySellerId.mockResolvedValue(EXISTING_TRIAL);

      const result = await useCase.requireOrStart(SELLER_ID);

      expect(result).toBe(EXISTING_TRIAL);
      expect(subscriptionsRepo.create).not.toHaveBeenCalled();
    });

    it('подписки нет → делегирует execute() и создаёт TRIAL', async () => {
      const result = await useCase.requireOrStart(SELLER_ID);

      // findBySellerId дёргается дважды: 1) requireOrStart, 2) execute внутри
      expect(subscriptionsRepo.findBySellerId).toHaveBeenCalledTimes(2);
      expect(subscriptionsRepo.create).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('TRIAL');
      expect(result.tier).toBe(DEFAULT_TRIAL_TIER);
    });
  });
});
