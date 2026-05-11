/**
 * Тесты для `VerifySellerExtendedUseCase`.
 *
 * Расширенная верификация продавца с reason/notes/checkedRequirements.
 * Покрытие:
 *   - валидация SellerVerificationStatus enum
 *   - REJECTED/SUSPENDED требуют reason
 *   - SUSPENDED → isBlocked=true + blockedReason
 *   - VERIFIED → isBlocked=false + blockedReason=null
 *   - audit log с полным контекстом
 *   - audit log fail не блокирует ответ
 */
import { SellerVerificationStatus } from '@prisma/client';
import { VerifySellerExtendedUseCase } from './verify-seller-extended.use-case';
import { PrismaService } from '../../../database/prisma.service';

const SELLER = {
  id: 'seller-1',
  userId: 'u-1',
  verificationStatus: SellerVerificationStatus.PENDING,
  fullName: 'Test Seller',
};

describe('VerifySellerExtendedUseCase', () => {
  let useCase: VerifySellerExtendedUseCase;
  let prisma: {
    seller: { findUnique: jest.Mock; update: jest.Mock };
    auditLog: { create: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      seller: {
        findUnique: jest.fn().mockResolvedValue(SELLER),
        update: jest.fn().mockImplementation(async (args: any) => ({
          ...SELLER,
          ...args.data,
        })),
      },
      auditLog: { create: jest.fn().mockResolvedValue(undefined) },
    };
    useCase = new VerifySellerExtendedUseCase(prisma as unknown as PrismaService);
  });

  describe('validation', () => {
    it('invalid status → VALIDATION_ERROR', async () => {
      await expect(useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: 'WTF' as SellerVerificationStatus,
      })).rejects.toThrow(/Invalid status/);
    });

    it('REJECTED без reason → VALIDATION_ERROR', async () => {
      await expect(useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.REJECTED,
      })).rejects.toThrow(/Reason is required/);
    });

    it('SUSPENDED без reason → VALIDATION_ERROR', async () => {
      await expect(useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.SUSPENDED,
      })).rejects.toThrow(/Reason is required/);
    });

    it('REJECTED с пустым reason (whitespace) → VALIDATION_ERROR', async () => {
      await expect(useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.REJECTED,
        reason: '   ',
      })).rejects.toThrow(/Reason is required/);
    });

    it('VERIFIED без reason → OK (reason не нужен для approve)', async () => {
      await expect(useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.VERIFIED,
      })).resolves.toBeDefined();
    });
  });

  describe('seller resolution', () => {
    it('seller не найден → 404', async () => {
      prisma.seller.findUnique.mockResolvedValue(null);
      await expect(useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'missing',
        status: SellerVerificationStatus.VERIFIED,
      })).rejects.toThrow(/Seller not found/);
    });
  });

  describe('block/unblock side effects', () => {
    it('SUSPENDED → isBlocked=true + blockedReason из reason', async () => {
      await useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.SUSPENDED,
        reason: 'fraud detected',
      });
      expect(prisma.seller.update).toHaveBeenCalledWith({
        where: { id: 'seller-1' },
        data: expect.objectContaining({
          verificationStatus: SellerVerificationStatus.SUSPENDED,
          isBlocked: true,
          blockedReason: 'fraud detected',
        }),
      });
    });

    it('VERIFIED → isBlocked=false + blockedReason=null', async () => {
      await useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.VERIFIED,
      });
      expect(prisma.seller.update).toHaveBeenCalledWith({
        where: { id: 'seller-1' },
        data: expect.objectContaining({
          verificationStatus: SellerVerificationStatus.VERIFIED,
          isBlocked: false,
          blockedReason: null,
        }),
      });
    });

    it('REJECTED → НЕ трогает isBlocked (только status)', async () => {
      await useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.REJECTED,
        reason: 'incomplete docs',
      });
      const dataArg = prisma.seller.update.mock.calls[0][0].data;
      expect(dataArg.verificationStatus).toBe(SellerVerificationStatus.REJECTED);
      expect(dataArg.isBlocked).toBeUndefined();
      expect(dataArg.blockedReason).toBeUndefined();
    });

    it('PENDING (нейтральный сброс) → НЕ трогает isBlocked', async () => {
      await useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.PENDING,
      });
      const dataArg = prisma.seller.update.mock.calls[0][0].data;
      expect(dataArg.isBlocked).toBeUndefined();
    });
  });

  describe('audit log', () => {
    it('action содержит lowercase status', async () => {
      await useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.VERIFIED,
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorUserId: 'admin-1',
          actorType: 'admin',
          action: 'seller.verification.verified',
          entityType: 'seller',
          entityId: 'seller-1',
        }),
      });
    });

    it('payload содержит previousStatus + newStatus + reason + notes + checkedRequirements + sellerName', async () => {
      await useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.SUSPENDED,
        reason: 'docs invalid',
        notes: 'second strike',
        checkedRequirements: ['docs_uploaded', 'tg_linked'],
      });
      const payload = prisma.auditLog.create.mock.calls[0][0].data.payload;
      expect(payload).toEqual({
        previousStatus: SellerVerificationStatus.PENDING,
        newStatus: SellerVerificationStatus.SUSPENDED,
        reason: 'docs invalid',
        notes: 'second strike',
        checkedRequirements: ['docs_uploaded', 'tg_linked'],
        sellerName: 'Test Seller',
      });
    });

    it('audit log throws → не пробрасывается (warn only)', async () => {
      prisma.auditLog.create.mockRejectedValue(new Error('audit DB down'));
      await expect(useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.VERIFIED,
      })).resolves.toBeDefined();
    });
  });

  describe('return shape', () => {
    it('возвращает id/verificationStatus/isBlocked + reason/notes/checkedRequirements', async () => {
      const result = await useCase.execute({
        adminUserId: 'admin-1',
        sellerId: 'seller-1',
        status: SellerVerificationStatus.VERIFIED,
        notes: 'OK',
        checkedRequirements: ['docs_uploaded'],
      });
      expect(result).toEqual({
        id: 'seller-1',
        verificationStatus: SellerVerificationStatus.VERIFIED,
        isBlocked: false,
        reason: null,
        notes: 'OK',
        checkedRequirements: ['docs_uploaded'],
      });
    });
  });
});
