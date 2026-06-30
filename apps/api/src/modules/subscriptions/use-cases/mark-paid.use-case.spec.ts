/**
 * Тесты для `MarkPaidUseCase`.
 *
 * Phase 1: ручное подтверждение оплаты подписки админом.
 * Покрытие:
 *   - happy path: создание SubscriptionPayment + перевод подписки в ACTIVE +
 *     запись audit log SUBSCRIPTION_PAYMENT_CONFIRMED;
 *   - preconditions: subscription not found → 404;
 *   - validation: periodStart >= periodEnd → 400;
 *   - default method: при отсутствии data.method → 'MANUAL_TRANSFER';
 *   - сброс grace/suspended/trial полей при активации.
 */
import { HttpStatus } from '@nestjs/common';
import { SubscriptionTier, SubscriptionPaymentMethod } from '@prisma/client';
import { MarkPaidUseCase } from './mark-paid.use-case';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SubscriptionPaymentsRepository } from '../repositories/subscription-payments.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const ADMIN_USER_ID = 'admin-1';
const SUBSCRIPTION_ID = 'sub-1';

const PERIOD_START = new Date('2026-06-01T00:00:00.000Z');
const PERIOD_END = new Date('2026-07-01T00:00:00.000Z');

const SUBSCRIPTION_PAST_DUE = {
  id: SUBSCRIPTION_ID,
  status: 'PAST_DUE',
  tier: SubscriptionTier.STARTER,
  storeId: 'store-1',
  graceEndsAt: new Date('2026-05-15T00:00:00.000Z'),
  suspendedAt: null,
  trialEndsAt: null,
};

const CREATED_PAYMENT = {
  id: 'pay-1',
  subscriptionId: SUBSCRIPTION_ID,
  status: 'CONFIRMED',
};

const DEFAULT_DATA = {
  tier: SubscriptionTier.STARTER,
  amountUzs: 199_000,
  periodStart: PERIOD_START,
  periodEnd: PERIOD_END,
  method: 'MANUAL_TRANSFER' as SubscriptionPaymentMethod,
  notes: 'Платёж по чеку #42',
};

describe('MarkPaidUseCase', () => {
  let useCase: MarkPaidUseCase;
  let subscriptionsRepo: { findById: jest.Mock; update: jest.Mock };
  let paymentsRepo: { create: jest.Mock };
  let adminRepo: { writeAuditLog: jest.Mock };

  beforeEach(() => {
    subscriptionsRepo = {
      findById: jest.fn().mockResolvedValue(SUBSCRIPTION_PAST_DUE),
      update: jest.fn().mockImplementation(async (_id, patch) => ({
        ...SUBSCRIPTION_PAST_DUE,
        ...patch,
      })),
    };
    paymentsRepo = {
      create: jest.fn().mockResolvedValue(CREATED_PAYMENT),
    };
    adminRepo = {
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    };
    const storesRepo = {
      findBySellerId: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    };
    useCase = new MarkPaidUseCase(
      subscriptionsRepo as unknown as SubscriptionsRepository,
      paymentsRepo as unknown as SubscriptionPaymentsRepository,
      adminRepo as unknown as AdminRepository,
      storesRepo as any,
    );
  });

  describe('preconditions', () => {
    it('subscription не найдена → 404 SUBSCRIPTION_NOT_FOUND', async () => {
      subscriptionsRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(ADMIN_USER_ID, 'sub-missing', DEFAULT_DATA),
      ).rejects.toMatchObject({
        code: ErrorCode.SUBSCRIPTION_NOT_FOUND,
        status: HttpStatus.NOT_FOUND,
      });

      expect(paymentsRepo.create).not.toHaveBeenCalled();
      expect(subscriptionsRepo.update).not.toHaveBeenCalled();
      expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
    });

    it('periodStart >= periodEnd → 400 VALIDATION_ERROR', async () => {
      const badData = {
        ...DEFAULT_DATA,
        periodStart: PERIOD_END,
        periodEnd: PERIOD_START,
      };

      await expect(
        useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, badData),
      ).rejects.toBeInstanceOf(DomainException);
      await expect(
        useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, badData),
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        status: HttpStatus.BAD_REQUEST,
      });

      expect(paymentsRepo.create).not.toHaveBeenCalled();
      expect(subscriptionsRepo.update).not.toHaveBeenCalled();
    });

    it('periodStart === periodEnd (равные даты) → 400 VALIDATION_ERROR', async () => {
      const sameDate = new Date('2026-06-01T00:00:00.000Z');
      const badData = {
        ...DEFAULT_DATA,
        periodStart: sameDate,
        periodEnd: sameDate,
      };

      await expect(
        useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, badData),
      ).rejects.toThrow(/periodStart must be before periodEnd/);
      expect(paymentsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('happy path', () => {
    it('создаёт CONFIRMED платёж с правильными полями', async () => {
      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, DEFAULT_DATA);

      expect(paymentsRepo.create).toHaveBeenCalledTimes(1);
      expect(paymentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: SUBSCRIPTION_ID,
          amountUzs: DEFAULT_DATA.amountUzs,
          method: 'MANUAL_TRANSFER',
          status: 'CONFIRMED',
          periodStart: PERIOD_START,
          periodEnd: PERIOD_END,
          confirmedByUserId: ADMIN_USER_ID,
          notes: DEFAULT_DATA.notes,
        }),
      );
      // confirmedAt — Date, проставляется внутри use-case
      const arg = paymentsRepo.create.mock.calls[0][0];
      expect(arg.confirmedAt).toBeInstanceOf(Date);
    });

    it('переключает подписку в ACTIVE с новым периодом и сбрасывает grace/suspended/trial', async () => {
      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, DEFAULT_DATA);

      expect(subscriptionsRepo.update).toHaveBeenCalledTimes(1);
      expect(subscriptionsRepo.update).toHaveBeenCalledWith(SUBSCRIPTION_ID, {
        tier: DEFAULT_DATA.tier,
        status: 'ACTIVE',
        currentPeriodStart: PERIOD_START,
        currentPeriodEnd: PERIOD_END,
        graceEndsAt: null,
        suspendedAt: null,
        trialEndsAt: null,
      });
    });

    it('пишет audit log SUBSCRIPTION_PAYMENT_CONFIRMED с paymentId, tier, prevStatus', async () => {
      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, DEFAULT_DATA);

      expect(adminRepo.writeAuditLog).toHaveBeenCalledTimes(1);
      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
        actorUserId: ADMIN_USER_ID,
        action: 'SUBSCRIPTION_PAYMENT_CONFIRMED',
        entityType: 'Subscription',
        entityId: SUBSCRIPTION_ID,
        payload: {
          paymentId: CREATED_PAYMENT.id,
          tier: DEFAULT_DATA.tier,
          amountUzs: DEFAULT_DATA.amountUzs,
          periodStart: PERIOD_START.toISOString(),
          periodEnd: PERIOD_END.toISOString(),
          method: 'MANUAL_TRANSFER',
          prevStatus: SUBSCRIPTION_PAST_DUE.status,
        },
      });
    });

    it('возвращает { subscription, payment } из репозиториев', async () => {
      const result = await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, DEFAULT_DATA);

      expect(result).toEqual({
        subscription: expect.objectContaining({
          id: SUBSCRIPTION_ID,
          status: 'ACTIVE',
          tier: DEFAULT_DATA.tier,
          currentPeriodStart: PERIOD_START,
          currentPeriodEnd: PERIOD_END,
        }),
        payment: CREATED_PAYMENT,
      });
    });

    it('SUSPENDED → ACTIVE: prevStatus прокидывается в audit log', async () => {
      subscriptionsRepo.findById.mockResolvedValue({
        ...SUBSCRIPTION_PAST_DUE,
        status: 'SUSPENDED',
        suspendedAt: new Date('2026-05-20T00:00:00.000Z'),
      });

      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, DEFAULT_DATA);

      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ prevStatus: 'SUSPENDED' }),
        }),
      );
    });
  });

  describe('default values', () => {
    it('method не задан → используется MANUAL_TRANSFER в payment и в audit log', async () => {
      const dataWithoutMethod = { ...DEFAULT_DATA };
      delete (dataWithoutMethod as { method?: SubscriptionPaymentMethod }).method;

      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, dataWithoutMethod);

      expect(paymentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'MANUAL_TRANSFER' }),
      );
      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ method: 'MANUAL_TRANSFER' }),
        }),
      );
    });

    it('notes не задан → передаётся undefined в payment.create', async () => {
      const dataWithoutNotes = { ...DEFAULT_DATA };
      delete (dataWithoutNotes as { notes?: string }).notes;

      await useCase.execute(ADMIN_USER_ID, SUBSCRIPTION_ID, dataWithoutNotes);

      expect(paymentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ notes: undefined }),
      );
    });
  });
});
