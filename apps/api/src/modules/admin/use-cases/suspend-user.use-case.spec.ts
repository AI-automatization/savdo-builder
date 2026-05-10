/**
 * Тесты для `SuspendUserUseCase`.
 *
 * INV-A01: каждое admin-действие пишет audit log.
 * INV-A02: suspension требует reason (DTO-level enforce, здесь принимаем string).
 */
import { SuspendUserUseCase } from './suspend-user.use-case';
import { AdminRepository } from '../repositories/admin.repository';

const USER_ACTIVE  = { id: 'u-1', phone: '+998900000001', status: 'ACTIVE' };
const USER_BLOCKED = { ...USER_ACTIVE, status: 'BLOCKED' };

describe('SuspendUserUseCase', () => {
  let useCase: SuspendUserUseCase;
  let adminRepo: {
    findUserById: jest.Mock;
    setUserStatus: jest.Mock;
    writeAuditLog: jest.Mock;
  };

  beforeEach(() => {
    adminRepo = {
      findUserById: jest.fn().mockResolvedValue(USER_ACTIVE),
      setUserStatus: jest.fn().mockResolvedValue(USER_BLOCKED),
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SuspendUserUseCase(adminRepo as unknown as AdminRepository);
  });

  it('user не найден → 404', async () => {
    adminRepo.findUserById.mockResolvedValue(null);
    await expect(useCase.execute('u-missing', 'admin-1', 'fraud'))
      .rejects.toThrow(/User not found/);
    expect(adminRepo.setUserStatus).not.toHaveBeenCalled();
    expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
  });

  it('user уже BLOCKED → 409', async () => {
    adminRepo.findUserById.mockResolvedValue(USER_BLOCKED);
    await expect(useCase.execute('u-1', 'admin-1', 'fraud'))
      .rejects.toThrow(/already suspended/);
    expect(adminRepo.setUserStatus).not.toHaveBeenCalled();
    expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
  });

  it('happy path → setUserStatus(BLOCKED) + audit log', async () => {
    const result = await useCase.execute('u-1', 'admin-1', 'fraud');
    expect(result).toEqual(USER_BLOCKED);
    expect(adminRepo.setUserStatus).toHaveBeenCalledWith('u-1', 'BLOCKED');
  });

  it('INV-A01: audit log записан с правильными полями', async () => {
    await useCase.execute('u-1', 'admin-1', 'spam');
    expect(adminRepo.writeAuditLog).toHaveBeenCalledWith({
      actorUserId: 'admin-1',
      action: 'USER_SUSPENDED',
      entityType: 'User',
      entityId: 'u-1',
      payload: { reason: 'spam', adminId: 'admin-1' },
    });
  });

  it('audit log пишется ПОСЛЕ setUserStatus (порядок важен — если status fail, лога не будет)', async () => {
    const calls: string[] = [];
    adminRepo.setUserStatus.mockImplementation(async () => { calls.push('setStatus'); return USER_BLOCKED; });
    adminRepo.writeAuditLog.mockImplementation(async () => { calls.push('audit'); });
    await useCase.execute('u-1', 'admin-1', 'fraud');
    expect(calls).toEqual(['setStatus', 'audit']);
  });
});
