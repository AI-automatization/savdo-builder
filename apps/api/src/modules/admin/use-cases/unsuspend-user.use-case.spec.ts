/**
 * Тесты для `UnsuspendUserUseCase` — симметрично suspend, обратная сторона.
 */
import { UnsuspendUserUseCase } from './unsuspend-user.use-case';
import { AdminRepository } from '../repositories/admin.repository';

const USER_BLOCKED = { id: 'u-1', phone: '+998900000001', status: 'BLOCKED' };
const USER_ACTIVE  = { ...USER_BLOCKED, status: 'ACTIVE' };

describe('UnsuspendUserUseCase', () => {
  let useCase: UnsuspendUserUseCase;
  let adminRepo: {
    findUserById: jest.Mock;
    setUserStatus: jest.Mock;
    writeAuditLog: jest.Mock;
  };

  beforeEach(() => {
    adminRepo = {
      findUserById: jest.fn().mockResolvedValue(USER_BLOCKED),
      setUserStatus: jest.fn().mockResolvedValue(USER_ACTIVE),
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new UnsuspendUserUseCase(adminRepo as unknown as AdminRepository);
  });

  it('user не найден → 404', async () => {
    adminRepo.findUserById.mockResolvedValue(null);
    await expect(useCase.execute('missing', 'admin-1', 'restore'))
      .rejects.toThrow(/User not found/);
    expect(adminRepo.setUserStatus).not.toHaveBeenCalled();
  });

  it('user уже ACTIVE → 409', async () => {
    adminRepo.findUserById.mockResolvedValue(USER_ACTIVE);
    await expect(useCase.execute('u-1', 'admin-1', 'restore'))
      .rejects.toThrow(/not suspended/);
    expect(adminRepo.setUserStatus).not.toHaveBeenCalled();
    expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
  });

  it('happy path: BLOCKED → ACTIVE + audit log USER_UNSUSPENDED', async () => {
    const result = await useCase.execute('u-1', 'admin-1', 'mistake');
    expect(result).toEqual(USER_ACTIVE);
    expect(adminRepo.setUserStatus).toHaveBeenCalledWith('u-1', 'ACTIVE');
    expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
      actorUserId: 'admin-1',
      action: 'USER_UNSUSPENDED',
      entityType: 'User',
      entityId: 'u-1',
      payload: { reason: 'mistake', adminId: 'admin-1' },
    });
  });
});
