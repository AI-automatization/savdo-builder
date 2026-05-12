/**
 * Тесты для `SetStoreVerificationUseCase` (MARKETING-VERIFIED-SELLER-001).
 *
 * Покрытие:
 *   - store not found → STORE_NOT_FOUND
 *   - verify: установка флага + audit log STORE_VERIFIED
 *   - unverify: установка флага + reason обязателен + audit log STORE_UNVERIFIED
 *   - unverify без reason → 400
 *   - идемпотентность: повторный verify не пишет audit log
 */
import { SetStoreVerificationUseCase } from './set-store-verification.use-case';
import { AdminRepository } from '../repositories/admin.repository';
import { PrismaService } from '../../../database/prisma.service';

describe('SetStoreVerificationUseCase', () => {
  let useCase: SetStoreVerificationUseCase;
  let adminRepo: { findStoreById: jest.Mock; writeAuditLog: jest.Mock };
  let prisma: { store: { update: jest.Mock } };

  beforeEach(() => {
    adminRepo = {
      findStoreById: jest.fn().mockResolvedValue({ id: 's-1', isVerified: false }),
      writeAuditLog: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      store: {
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 's-1', isVerified: data.isVerified,
        })),
      },
    };
    useCase = new SetStoreVerificationUseCase(
      adminRepo as unknown as AdminRepository,
      prisma as unknown as PrismaService,
    );
  });

  it('store not found → STORE_NOT_FOUND', async () => {
    adminRepo.findStoreById.mockResolvedValue(null);
    await expect(useCase.execute({
      storeId: 's-x', actorUserId: 'a-1', isVerified: true,
    })).rejects.toThrow(/Store not found/);
  });

  it('verify: ставит флаг + audit STORE_VERIFIED', async () => {
    const result = await useCase.execute({
      storeId: 's-1', actorUserId: 'a-1', isVerified: true,
    });
    expect(result.isVerified).toBe(true);
    expect(prisma.store.update).toHaveBeenCalledWith({
      where: { id: 's-1' },
      data: { isVerified: true },
      select: expect.any(Object),
    });
    expect(adminRepo.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'STORE_VERIFIED',
      entityType: 'Store',
      entityId: 's-1',
    }));
  });

  it('unverify: ставит флаг + audit STORE_UNVERIFIED + reason передаётся', async () => {
    adminRepo.findStoreById.mockResolvedValue({ id: 's-1', isVerified: true });
    const result = await useCase.execute({
      storeId: 's-1', actorUserId: 'a-1', isVerified: false, reason: 'inactive seller',
    });
    expect(result.isVerified).toBe(false);
    expect(adminRepo.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'STORE_UNVERIFIED',
      payload: expect.objectContaining({ reason: 'inactive seller' }),
    }));
  });

  it('unverify без reason → VALIDATION_ERROR', async () => {
    adminRepo.findStoreById.mockResolvedValue({ id: 's-1', isVerified: true });
    await expect(useCase.execute({
      storeId: 's-1', actorUserId: 'a-1', isVerified: false,
    })).rejects.toThrow(/Reason is required/);
    expect(prisma.store.update).not.toHaveBeenCalled();
  });

  it('идемпотентность: уже verified → no update, no audit', async () => {
    adminRepo.findStoreById.mockResolvedValue({ id: 's-1', isVerified: true });
    const result = await useCase.execute({
      storeId: 's-1', actorUserId: 'a-1', isVerified: true,
    });
    expect(result.isVerified).toBe(true);
    expect(prisma.store.update).not.toHaveBeenCalled();
    expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
  });

  it('идемпотентность: уже unverified → no update, no audit (reason не нужен)', async () => {
    adminRepo.findStoreById.mockResolvedValue({ id: 's-1', isVerified: false });
    const result = await useCase.execute({
      storeId: 's-1', actorUserId: 'a-1', isVerified: false,
    });
    expect(result.isVerified).toBe(false);
    expect(adminRepo.writeAuditLog).not.toHaveBeenCalled();
  });
});
