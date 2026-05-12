/**
 * Тесты для `UnsuspendStoreUseCase` — симметрично suspend.
 */
import { UnsuspendStoreUseCase } from './unsuspend-store.use-case';
import { AdminRepository } from '../repositories/admin.repository';

const STORE_SUSPENDED = { id: 'store-1', name: 'My Store', status: 'SUSPENDED' };
const STORE_APPROVED  = { ...STORE_SUSPENDED, status: 'APPROVED' };

describe('UnsuspendStoreUseCase', () => {
  let useCase: UnsuspendStoreUseCase;
  let adminRepo: {
    findStoreById: jest.Mock;
    updateStoreStatus: jest.Mock;
    writeAuditLog: jest.Mock;
  };

  beforeEach(() => {
    adminRepo = {
      findStoreById: jest.fn().mockResolvedValue(STORE_SUSPENDED),
      updateStoreStatus: jest.fn().mockResolvedValue(STORE_APPROVED),
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new UnsuspendStoreUseCase(adminRepo as unknown as AdminRepository);
  });

  it('store не найден → 404', async () => {
    adminRepo.findStoreById.mockResolvedValue(null);
    await expect(useCase.execute('missing', 'admin-1', 'restore'))
      .rejects.toThrow(/Store not found/);
  });

  describe('store не SUSPENDED → STORE_INVALID_TRANSITION', () => {
    test.each(['APPROVED', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED', 'DRAFT'])(
      'статус %s → 409',
      async (status) => {
        adminRepo.findStoreById.mockResolvedValue({ ...STORE_SUSPENDED, status });
        await expect(useCase.execute('store-1', 'admin-1', 'restore'))
          .rejects.toThrow(/not suspended/);
        expect(adminRepo.updateStoreStatus).not.toHaveBeenCalled();
      },
    );
  });

  it('happy path: SUSPENDED → APPROVED + audit STORE_UNSUSPENDED', async () => {
    const result = await useCase.execute('store-1', 'admin-1', 'reviewed');
    expect(result).toEqual(STORE_APPROVED);
    expect(adminRepo.updateStoreStatus).toHaveBeenCalledWith('store-1', 'APPROVED');
    expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
      actorUserId: 'admin-1',
      action: 'STORE_UNSUSPENDED',
      entityType: 'Store',
      entityId: 'store-1',
      payload: { reason: 'reviewed', adminId: 'admin-1' },
    });
  });
});
