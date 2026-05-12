/**
 * Тесты для `SuspendStoreUseCase`.
 *
 * INV-A01: audit log mandatory.
 * INV-A02: suspension requires reason.
 */
import { SuspendStoreUseCase } from './suspend-store.use-case';
import { AdminRepository } from '../repositories/admin.repository';

const STORE_APPROVED  = { id: 'store-1', name: 'My Store', status: 'APPROVED' };
const STORE_SUSPENDED = { ...STORE_APPROVED, status: 'SUSPENDED' };

describe('SuspendStoreUseCase', () => {
  let useCase: SuspendStoreUseCase;
  let adminRepo: {
    findStoreById: jest.Mock;
    updateStoreStatus: jest.Mock;
    writeAuditLog: jest.Mock;
  };

  beforeEach(() => {
    adminRepo = {
      findStoreById: jest.fn().mockResolvedValue(STORE_APPROVED),
      updateStoreStatus: jest.fn().mockResolvedValue(STORE_SUSPENDED),
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SuspendStoreUseCase(adminRepo as unknown as AdminRepository);
  });

  it('store не найден → 404', async () => {
    adminRepo.findStoreById.mockResolvedValue(null);
    await expect(useCase.execute('s-missing', 'admin-1', 'fraud'))
      .rejects.toThrow(/Store not found/);
    expect(adminRepo.updateStoreStatus).not.toHaveBeenCalled();
    expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
  });

  it('store уже SUSPENDED → 409', async () => {
    adminRepo.findStoreById.mockResolvedValue(STORE_SUSPENDED);
    await expect(useCase.execute('store-1', 'admin-1', 'fraud'))
      .rejects.toThrow(/already suspended/);
    expect(adminRepo.updateStoreStatus).not.toHaveBeenCalled();
    expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
  });

  it('happy path: APPROVED → SUSPENDED + audit log', async () => {
    const result = await useCase.execute('store-1', 'admin-1', 'spam reports');
    expect(result).toEqual(STORE_SUSPENDED);
    expect(adminRepo.updateStoreStatus).toHaveBeenCalledWith('store-1', 'SUSPENDED');
  });

  it('audit log включает previousStatus (для возможного un-suspend rollback)', async () => {
    await useCase.execute('store-1', 'admin-1', 'spam');
    expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
      actorUserId: 'admin-1',
      action: 'STORE_SUSPENDED',
      entityType: 'Store',
      entityId: 'store-1',
      payload: { reason: 'spam', adminId: 'admin-1', previousStatus: 'APPROVED' },
    });
  });

  it('updateStoreStatus → audit log порядок (audit только после успешного update)', async () => {
    const calls: string[] = [];
    adminRepo.updateStoreStatus.mockImplementation(async () => { calls.push('update'); return STORE_SUSPENDED; });
    adminRepo.writeAuditLog.mockImplementation(async () => { calls.push('audit'); });
    await useCase.execute('store-1', 'admin-1', 'fraud');
    expect(calls).toEqual(['update', 'audit']);
  });
});
