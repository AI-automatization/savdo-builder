/**
 * Тесты для `CancelSubscriptionUseCase`.
 *
 * Phase 1 instant cancel: status → CANCELLED, cancelledAt = now, audit log.
 * Покрытие:
 *   - executeBySeller: seller not found → 404, subscription not found → 404, happy path
 *   - executeByAdmin: subscription not found → 404, happy path
 *   - doCancel (через публичные методы):
 *       * уже CANCELLED → 409 INVALID_PLAN_TRANSITION
 *       * уже CHURNED → 409 INVALID_PLAN_TRANSITION
 *       * audit log пишется с правильным payload (byRole, reason, prevStatus)
 *       * update вызывается с status=CANCELLED + cancelledAt
 */
import { HttpStatus } from '@nestjs/common';
import { CancelSubscriptionUseCase } from './cancel-subscription.use-case';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const SELLER = {
  id: 'seller-1',
  userId: 'user-1',
};

const SUBSCRIPTION_ACTIVE = {
  id: 'sub-1',
  sellerId: 'seller-1',
  status: 'ACTIVE',
  plan: 'PRO',
};

describe('CancelSubscriptionUseCase', () => {
  let useCase: CancelSubscriptionUseCase;
  let subscriptionsRepo: {
    findById: jest.Mock;
    findBySellerId: jest.Mock;
    update: jest.Mock;
  };
  let sellersRepo: { findByUserId: jest.Mock };
  let adminRepo: { writeAuditLog: jest.Mock };

  beforeEach(() => {
    subscriptionsRepo = {
      findById: jest.fn().mockResolvedValue(SUBSCRIPTION_ACTIVE),
      findBySellerId: jest.fn().mockResolvedValue(SUBSCRIPTION_ACTIVE),
      update: jest.fn().mockImplementation(async (_id, patch) => ({
        ...SUBSCRIPTION_ACTIVE,
        ...patch,
      })),
    };
    sellersRepo = {
      findByUserId: jest.fn().mockResolvedValue(SELLER),
    };
    adminRepo = {
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new CancelSubscriptionUseCase(
      subscriptionsRepo as unknown as SubscriptionsRepository,
      sellersRepo as unknown as SellersRepository,
      adminRepo as unknown as AdminRepository,
    );
  });

  describe('executeBySeller', () => {
    it('seller не найден → 404 NOT_FOUND', async () => {
      sellersRepo.findByUserId.mockResolvedValue(null);

      await expect(useCase.executeBySeller('user-missing', 'too expensive'))
        .rejects.toThrow(DomainException);

      expect(subscriptionsRepo.findBySellerId).not.toHaveBeenCalled();
      expect(subscriptionsRepo.update).not.toHaveBeenCalled();
      expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
    });

    it('subscription не найдена → 404 SUBSCRIPTION_NOT_FOUND', async () => {
      subscriptionsRepo.findBySellerId.mockResolvedValue(null);

      await expect(useCase.executeBySeller('user-1', 'no need'))
        .rejects.toMatchObject({
          code: ErrorCode.SUBSCRIPTION_NOT_FOUND,
          status: HttpStatus.NOT_FOUND,
        });

      expect(subscriptionsRepo.update).not.toHaveBeenCalled();
      expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
    });

    it('happy path → status=CANCELLED, cancelledAt set, audit byRole=seller', async () => {
      const result = await useCase.executeBySeller('user-1', 'too expensive');

      expect(sellersRepo.findByUserId).toHaveBeenCalledWith('user-1');
      expect(subscriptionsRepo.findBySellerId).toHaveBeenCalledWith('seller-1');
      expect(subscriptionsRepo.update).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
        }),
      );
      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
        actorUserId: 'user-1',
        action: 'SUBSCRIPTION_CANCELLED',
        entityType: 'Subscription',
        entityId: 'sub-1',
        payload: {
          prevStatus: 'ACTIVE',
          byRole: 'seller',
          reason: 'too expensive',
        },
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('reason не передан → audit payload.reason = null', async () => {
      await useCase.executeBySeller('user-1');

      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ reason: null, byRole: 'seller' }),
        }),
      );
    });
  });

  describe('executeByAdmin', () => {
    it('subscription не найдена → 404 SUBSCRIPTION_NOT_FOUND', async () => {
      subscriptionsRepo.findById.mockResolvedValue(null);

      await expect(useCase.executeByAdmin('admin-1', 'sub-missing', 'fraud'))
        .rejects.toMatchObject({
          code: ErrorCode.SUBSCRIPTION_NOT_FOUND,
          status: HttpStatus.NOT_FOUND,
        });

      expect(subscriptionsRepo.update).not.toHaveBeenCalled();
      expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
    });

    it('happy path → status=CANCELLED, audit byRole=admin, actorUserId = adminUserId', async () => {
      const result = await useCase.executeByAdmin('admin-1', 'sub-1', 'fraud detected');

      expect(subscriptionsRepo.findById).toHaveBeenCalledWith('sub-1');
      expect(sellersRepo.findByUserId).not.toHaveBeenCalled();
      expect(subscriptionsRepo.update).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
        }),
      );
      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
        actorUserId: 'admin-1',
        action: 'SUBSCRIPTION_CANCELLED',
        entityType: 'Subscription',
        entityId: 'sub-1',
        payload: {
          prevStatus: 'ACTIVE',
          byRole: 'admin',
          reason: 'fraud detected',
        },
      });
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('terminal status guard (doCancel)', () => {
    const terminal: Array<['CANCELLED' | 'CHURNED']> = [['CANCELLED'], ['CHURNED']];

    test.each(terminal)(
      'seller: уже %s → 409 INVALID_PLAN_TRANSITION',
      async (status) => {
        subscriptionsRepo.findBySellerId.mockResolvedValue({
          ...SUBSCRIPTION_ACTIVE,
          status,
        });

        await expect(useCase.executeBySeller('user-1', 'retry'))
          .rejects.toMatchObject({
            code: ErrorCode.INVALID_PLAN_TRANSITION,
            status: HttpStatus.CONFLICT,
          });

        expect(subscriptionsRepo.update).not.toHaveBeenCalled();
        expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
      },
    );

    test.each(terminal)(
      'admin: уже %s → 409 INVALID_PLAN_TRANSITION',
      async (status) => {
        subscriptionsRepo.findById.mockResolvedValue({
          ...SUBSCRIPTION_ACTIVE,
          status,
        });

        await expect(useCase.executeByAdmin('admin-1', 'sub-1', 'reason'))
          .rejects.toMatchObject({
            code: ErrorCode.INVALID_PLAN_TRANSITION,
            status: HttpStatus.CONFLICT,
          });

        expect(subscriptionsRepo.update).not.toHaveBeenCalled();
        expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
      },
    );
  });
});
