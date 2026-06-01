/**
 * Тесты для `ExtendTrialUseCase`.
 *
 * Admin продлевает триал подписки на N дней.
 * Покрытие:
 *   - validation: days вне диапазона [1..365]
 *   - preconditions: subscription not found → 404
 *   - state machine: extend разрешён только из TRIAL и PAST_DUE
 *   - happy path: TRIAL → продление от trialEndsAt
 *   - happy path: PAST_DUE → сброс graceEndsAt + статус TRIAL
 *   - happy path: trialEndsAt=null → продление от now
 *   - audit log: запись SUBSCRIPTION_TRIAL_EXTENDED с корректным payload
 */
import { HttpStatus } from '@nestjs/common';
import { ExtendTrialUseCase } from './extend-trial.use-case';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const ADMIN_USER_ID = 'admin-1';
const SUBSCRIPTION_ID = 'sub-1';

const TRIAL_END = new Date('2026-06-15T00:00:00.000Z');

const SUBSCRIPTION_TRIAL = {
  id: SUBSCRIPTION_ID,
  status: 'TRIAL' as const,
  trialEndsAt: TRIAL_END,
  graceEndsAt: null as Date | null,
};

const SUBSCRIPTION_PAST_DUE = {
  id: SUBSCRIPTION_ID,
  status: 'PAST_DUE' as const,
  trialEndsAt: TRIAL_END,
  graceEndsAt: new Date('2026-06-20T00:00:00.000Z'),
};

describe('ExtendTrialUseCase', () => {
  let useCase: ExtendTrialUseCase;
  let subscriptionsRepo: { findById: jest.Mock; update: jest.Mock };
  let adminRepo: { writeAuditLog: jest.Mock };

  beforeEach(() => {
    subscriptionsRepo = {
      findById: jest.fn().mockResolvedValue(SUBSCRIPTION_TRIAL),
      update: jest.fn().mockImplementation(async (id, patch) => ({
        ...SUBSCRIPTION_TRIAL,
        ...patch,
        id,
      })),
    };
    adminRepo = {
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new ExtendTrialUseCase(
      subscriptionsRepo as unknown as SubscriptionsRepository,
      adminRepo as unknown as AdminRepository,
    );
  });

  describe('validation', () => {
    it.each([0, -1, -100, 366, 1000])(
      'days=%s вне диапазона → VALIDATION_ERROR / 400',
      async (days) => {
        await expect(
          useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days }),
        ).rejects.toMatchObject({
          code: ErrorCode.VALIDATION_ERROR,
          httpStatus: HttpStatus.BAD_REQUEST,
        });
        expect(subscriptionsRepo.findById).not.toHaveBeenCalled();
        expect(subscriptionsRepo.update).not.toHaveBeenCalled();
        expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
      },
    );

    it.each([1, 7, 30, 365])('days=%s в пределах диапазона → проходит валидацию', async (days) => {
      await expect(
        useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days }),
      ).resolves.toBeDefined();
    });
  });

  describe('preconditions', () => {
    it('subscription не найдена → SUBSCRIPTION_NOT_FOUND / 404', async () => {
      subscriptionsRepo.findById.mockResolvedValue(null);
      await expect(
        useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days: 7 }),
      ).rejects.toMatchObject({
        code: ErrorCode.SUBSCRIPTION_NOT_FOUND,
        httpStatus: HttpStatus.NOT_FOUND,
      });
      expect(subscriptionsRepo.update).not.toHaveBeenCalled();
      expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
    });

    it.each(['ACTIVE', 'CANCELED', 'EXPIRED', 'PAUSED'])(
      'статус=%s → INVALID_PLAN_TRANSITION / 409',
      async (status) => {
        subscriptionsRepo.findById.mockResolvedValue({
          ...SUBSCRIPTION_TRIAL,
          status,
        });
        await expect(
          useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days: 7 }),
        ).rejects.toMatchObject({
          code: ErrorCode.INVALID_PLAN_TRANSITION,
          httpStatus: HttpStatus.CONFLICT,
        });
        expect(subscriptionsRepo.update).not.toHaveBeenCalled();
        expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
      },
    );
  });

  describe('happy path — TRIAL', () => {
    it('продлевает trialEndsAt на N дней от текущего trialEndsAt', async () => {
      const days = 7;
      const expectedTrialEnd = new Date(TRIAL_END.getTime() + days * 24 * 60 * 60 * 1000);

      const result = await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, {
        days,
        reason: 'beta onboarding',
      });

      expect(subscriptionsRepo.update).toHaveBeenCalledWith(SUBSCRIPTION_ID, {
        status: 'TRIAL',
        trialEndsAt: expectedTrialEnd,
        graceEndsAt: null,
      });
      expect(result.trialEndsAt).toEqual(expectedTrialEnd);
      expect(result.status).toBe('TRIAL');
    });

    it('если trialEndsAt=null → продлевает от now()', async () => {
      subscriptionsRepo.findById.mockResolvedValue({
        ...SUBSCRIPTION_TRIAL,
        trialEndsAt: null,
      });
      const before = Date.now();
      const days = 14;

      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days });

      const after = Date.now();
      const call = subscriptionsRepo.update.mock.calls[0];
      const newTrialEnd: Date = call[1].trialEndsAt;
      const expectedMin = before + days * 24 * 60 * 60 * 1000;
      const expectedMax = after + days * 24 * 60 * 60 * 1000;

      expect(newTrialEnd.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(newTrialEnd.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('happy path — PAST_DUE → TRIAL', () => {
    it('возвращает в TRIAL и сбрасывает graceEndsAt', async () => {
      subscriptionsRepo.findById.mockResolvedValue(SUBSCRIPTION_PAST_DUE);
      const days = 5;

      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days, reason: 'second chance' });

      expect(subscriptionsRepo.update).toHaveBeenCalledWith(
        SUBSCRIPTION_ID,
        expect.objectContaining({
          status: 'TRIAL',
          graceEndsAt: null,
        }),
      );
    });
  });

  describe('audit log', () => {
    it('пишет SUBSCRIPTION_TRIAL_EXTENDED с полным payload', async () => {
      const days = 10;
      const reason = 'manual extension by sales';
      const expectedTrialEnd = new Date(TRIAL_END.getTime() + days * 24 * 60 * 60 * 1000);

      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days, reason });

      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
        actorUserId: ADMIN_USER_ID,
        action: 'SUBSCRIPTION_TRIAL_EXTENDED',
        entityType: 'Subscription',
        entityId: SUBSCRIPTION_ID,
        payload: {
          days,
          reason,
          prevTrialEnd: TRIAL_END.toISOString(),
          newTrialEnd: expectedTrialEnd.toISOString(),
          prevStatus: 'TRIAL',
        },
      });
    });

    it('reason не передан → payload.reason=null', async () => {
      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days: 3 });

      const call = adminRepo.writeAuditLog.mock.calls[0][0];
      expect(call.payload.reason).toBeNull();
    });

    it('prevTrialEnd=null корректно сериализуется в payload', async () => {
      subscriptionsRepo.findById.mockResolvedValue({
        ...SUBSCRIPTION_TRIAL,
        trialEndsAt: null,
      });

      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days: 7 });

      const call = adminRepo.writeAuditLog.mock.calls[0][0];
      expect(call.payload.prevTrialEnd).toBeNull();
    });

    it('PAST_DUE → payload.prevStatus=PAST_DUE', async () => {
      subscriptionsRepo.findById.mockResolvedValue(SUBSCRIPTION_PAST_DUE);

      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days: 3 });

      const call = adminRepo.writeAuditLog.mock.calls[0][0];
      expect(call.payload.prevStatus).toBe('PAST_DUE');
    });
  });

  describe('DomainException shape', () => {
    it('бросает именно DomainException (не generic Error)', async () => {
      subscriptionsRepo.findById.mockResolvedValue(null);
      await expect(
        useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, { days: 7 }),
      ).rejects.toBeInstanceOf(DomainException);
    });
  });
});
