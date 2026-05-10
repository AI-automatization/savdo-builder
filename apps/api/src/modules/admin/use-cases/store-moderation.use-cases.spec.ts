/**
 * Объединённые тесты для 4 store moderation use-cases:
 *   - ApproveStoreUseCase
 *   - RejectStoreUseCase
 *   - ArchiveStoreUseCase
 *   - UnapproveStoreUseCase
 *
 * Все следуют одной структуре: load store → state guard → mutate → INV-A01 audit.
 */
import { ApproveStoreUseCase } from './approve-store.use-case';
import { RejectStoreUseCase } from './reject-store.use-case';
import { ArchiveStoreUseCase } from './archive-store.use-case';
import { UnapproveStoreUseCase } from './unapprove-store.use-case';
import { AdminRepository } from '../repositories/admin.repository';

describe('store moderation use-cases', () => {
  let adminRepo: {
    findStoreById: jest.Mock;
    approveAndPublishStore: jest.Mock;
    updateStoreStatus: jest.Mock;
    unapproveStore: jest.Mock;
    writeAuditLog: jest.Mock;
  };

  beforeEach(() => {
    adminRepo = {
      findStoreById: jest.fn(),
      approveAndPublishStore: jest.fn().mockResolvedValue({ id: 's1', status: 'APPROVED' }),
      updateStoreStatus: jest.fn().mockImplementation(async (_id, s) => ({ id: 's1', status: s })),
      unapproveStore: jest.fn().mockResolvedValue({ id: 's1', status: 'PENDING_REVIEW' }),
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    };
  });

  // ─── ApproveStoreUseCase ─────────────────────────────────────────────

  describe('ApproveStoreUseCase', () => {
    let useCase: ApproveStoreUseCase;
    beforeEach(() => {
      useCase = new ApproveStoreUseCase(adminRepo as unknown as AdminRepository);
    });

    it('store не найден → 404', async () => {
      adminRepo.findStoreById.mockResolvedValue(null);
      await expect(useCase.execute('missing', 'a-1')).rejects.toThrow(/Store not found/);
    });

    test.each(['APPROVED', 'SUSPENDED', 'REJECTED', 'ARCHIVED'])(
      'статус %s → STORE_INVALID_TRANSITION (можно только из PENDING_REVIEW/DRAFT)',
      async (status) => {
        adminRepo.findStoreById.mockResolvedValue({ id: 's1', status });
        await expect(useCase.execute('s1', 'a-1')).rejects.toThrow(/cannot be approved/);
        expect(adminRepo.approveAndPublishStore).not.toHaveBeenCalled();
      },
    );

    test.each(['PENDING_REVIEW', 'DRAFT'])(
      '%s → APPROVED + audit STORE_APPROVED',
      async (status) => {
        adminRepo.findStoreById.mockResolvedValue({ id: 's1', status });
        await useCase.execute('s1', 'a-1');
        expect(adminRepo.approveAndPublishStore).toHaveBeenCalledWith('s1');
        expect(adminRepo.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
          action: 'STORE_APPROVED',
          entityType: 'Store',
          entityId: 's1',
          payload: { adminId: 'a-1' },
        }));
      },
    );
  });

  // ─── RejectStoreUseCase ──────────────────────────────────────────────

  describe('RejectStoreUseCase', () => {
    let useCase: RejectStoreUseCase;
    beforeEach(() => {
      useCase = new RejectStoreUseCase(adminRepo as unknown as AdminRepository);
    });

    it('store не найден → 404', async () => {
      adminRepo.findStoreById.mockResolvedValue(null);
      await expect(useCase.execute('missing', 'a-1', 'spam')).rejects.toThrow(/Store not found/);
    });

    it('store уже REJECTED → 409', async () => {
      adminRepo.findStoreById.mockResolvedValue({ id: 's1', status: 'REJECTED' });
      await expect(useCase.execute('s1', 'a-1', 'spam')).rejects.toThrow(/already rejected/);
      expect(adminRepo.updateStoreStatus).not.toHaveBeenCalled();
    });

    it('PENDING_REVIEW → REJECTED + audit с reason и previousStatus', async () => {
      adminRepo.findStoreById.mockResolvedValue({ id: 's1', status: 'PENDING_REVIEW' });
      await useCase.execute('s1', 'a-1', 'incorrect docs');
      expect(adminRepo.updateStoreStatus).toHaveBeenCalledWith('s1', 'REJECTED');
      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
        actorUserId: 'a-1',
        action: 'STORE_REJECTED',
        entityType: 'Store',
        entityId: 's1',
        payload: { reason: 'incorrect docs', adminId: 'a-1', previousStatus: 'PENDING_REVIEW' },
      });
    });
  });

  // ─── ArchiveStoreUseCase ─────────────────────────────────────────────

  describe('ArchiveStoreUseCase', () => {
    let useCase: ArchiveStoreUseCase;
    beforeEach(() => {
      useCase = new ArchiveStoreUseCase(adminRepo as unknown as AdminRepository);
    });

    it('store не найден → 404', async () => {
      adminRepo.findStoreById.mockResolvedValue(null);
      await expect(useCase.execute('missing', 'a-1', 'cleanup')).rejects.toThrow(/Store not found/);
    });

    it('store уже ARCHIVED → 409', async () => {
      adminRepo.findStoreById.mockResolvedValue({ id: 's1', status: 'ARCHIVED' });
      await expect(useCase.execute('s1', 'a-1', 'cleanup')).rejects.toThrow(/already archived/);
    });

    it('APPROVED → ARCHIVED + audit с reason', async () => {
      adminRepo.findStoreById.mockResolvedValue({ id: 's1', status: 'APPROVED' });
      await useCase.execute('s1', 'a-1', 'inactive 6mo');
      expect(adminRepo.updateStoreStatus).toHaveBeenCalledWith('s1', 'ARCHIVED');
      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
        actorUserId: 'a-1',
        action: 'STORE_ARCHIVED',
        entityType: 'Store',
        entityId: 's1',
        payload: { reason: 'inactive 6mo', adminId: 'a-1', previousStatus: 'APPROVED' },
      });
    });
  });

  // ─── UnapproveStoreUseCase ───────────────────────────────────────────

  describe('UnapproveStoreUseCase', () => {
    let useCase: UnapproveStoreUseCase;
    beforeEach(() => {
      useCase = new UnapproveStoreUseCase(adminRepo as unknown as AdminRepository);
    });

    it('store не найден → 404', async () => {
      adminRepo.findStoreById.mockResolvedValue(null);
      await expect(useCase.execute('missing', 'a-1')).rejects.toThrow(/Store not found/);
    });

    test.each(['PENDING_REVIEW', 'DRAFT', 'SUSPENDED', 'REJECTED', 'ARCHIVED'])(
      'не-APPROVED статус %s → STORE_INVALID_TRANSITION',
      async (status) => {
        adminRepo.findStoreById.mockResolvedValue({ id: 's1', status });
        await expect(useCase.execute('s1', 'a-1')).rejects.toThrow(/Only approved stores/);
        expect(adminRepo.unapproveStore).not.toHaveBeenCalled();
      },
    );

    it('APPROVED → unapproveStore + audit STORE_UNAPPROVED', async () => {
      adminRepo.findStoreById.mockResolvedValue({ id: 's1', status: 'APPROVED' });
      await useCase.execute('s1', 'a-1');
      expect(adminRepo.unapproveStore).toHaveBeenCalledWith('s1');
      expect(adminRepo.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'STORE_UNAPPROVED',
        entityType: 'Store',
        entityId: 's1',
      }));
    });
  });
});
