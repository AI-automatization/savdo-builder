/**
 * Объединённые тесты для moderation use-cases:
 *   - GetModerationQueue: pagination forwarding
 *   - GetCaseDetail: not found → MODERATION_CASE_NOT_FOUND
 *   - AssignCase: admin profile resolution + audit log + transaction
 *   - TakeAction: APPROVE/REJECT/ESCALATE/REQUEST_CHANGES — состояние CLOSED vs no-op,
 *     INV-A02 reject требует comment, side effects на store/seller, audit log
 */
import {
  ModerationActionType,
  ModerationCaseStatus,
  SellerVerificationStatus,
  StoreStatus,
} from '@prisma/client';
import { GetModerationQueueUseCase } from './get-moderation-queue.use-case';
import { GetCaseDetailUseCase } from './get-case-detail.use-case';
import { AssignCaseUseCase } from './assign-case.use-case';
import { TakeActionUseCase } from './take-action.use-case';
import { ModerationRepository } from '../repositories/moderation.repository';
import { StoresRepository } from '../../stores/repositories/stores.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { PrismaService } from '../../../database/prisma.service';

const ADMIN = { id: 'admin-1', userId: 'u-admin' };
const STORE_CASE = {
  id: 'case-1',
  entityType: 'store',
  entityId: 'store-1',
  status: ModerationCaseStatus.OPEN,
};
const SELLER_CASE = {
  id: 'case-2',
  entityType: 'seller',
  entityId: 'seller-1',
  status: ModerationCaseStatus.OPEN,
};

function makeTx() {
  return {
    moderationAction: { create: jest.fn().mockResolvedValue(undefined) },
    moderationCase: { update: jest.fn().mockResolvedValue(undefined) },
    store: { update: jest.fn().mockResolvedValue(undefined) },
    seller: { update: jest.fn().mockResolvedValue(undefined) },
    auditLog: { create: jest.fn().mockResolvedValue(undefined) },
  };
}

describe('GetModerationQueueUseCase', () => {
  it('передаёт options в repo.findPendingCases', async () => {
    const repo = { findPendingCases: jest.fn().mockResolvedValue([]) };
    const useCase = new GetModerationQueueUseCase(repo as unknown as ModerationRepository);
    await useCase.execute({ page: 2, limit: 50 });
    expect(repo.findPendingCases).toHaveBeenCalledWith({ page: 2, limit: 50 });
  });

  it('без options — undefined forwarded', async () => {
    const repo = { findPendingCases: jest.fn().mockResolvedValue([]) };
    const useCase = new GetModerationQueueUseCase(repo as unknown as ModerationRepository);
    await useCase.execute();
    expect(repo.findPendingCases).toHaveBeenCalledWith(undefined);
  });
});

describe('GetCaseDetailUseCase', () => {
  it('not found → MODERATION_CASE_NOT_FOUND', async () => {
    const repo = { findCaseById: jest.fn().mockResolvedValue(null) };
    const useCase = new GetCaseDetailUseCase(repo as unknown as ModerationRepository);
    await expect(useCase.execute('missing')).rejects.toThrow(/Moderation case not found/);
  });

  it('happy: возвращает кейс', async () => {
    const repo = { findCaseById: jest.fn().mockResolvedValue(STORE_CASE) };
    const useCase = new GetCaseDetailUseCase(repo as unknown as ModerationRepository);
    const result = await useCase.execute('case-1');
    expect(result).toEqual(STORE_CASE);
  });
});

describe('AssignCaseUseCase', () => {
  let useCase: AssignCaseUseCase;
  let repo: { findAdminByUserId: jest.Mock; findCaseById: jest.Mock };
  let prisma: { $transaction: jest.Mock };
  let tx: ReturnType<typeof makeTx>;

  beforeEach(() => {
    tx = makeTx();
    repo = {
      findAdminByUserId: jest.fn().mockResolvedValue(ADMIN),
      findCaseById: jest.fn().mockResolvedValue(STORE_CASE),
    };
    prisma = {
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(tx)),
    };
    useCase = new AssignCaseUseCase(
      repo as unknown as ModerationRepository,
      prisma as unknown as PrismaService,
    );
  });

  it('admin не найден → FORBIDDEN', async () => {
    repo.findAdminByUserId.mockResolvedValue(null);
    await expect(useCase.execute('case-1', 'u-admin')).rejects.toThrow(/Admin profile not found/);
  });

  it('case не найден → 404', async () => {
    repo.findCaseById.mockResolvedValueOnce(null);
    await expect(useCase.execute('missing', 'u-admin')).rejects.toThrow(/Moderation case not found/);
  });

  it('happy: assign в transaction → update + action + audit log', async () => {
    await useCase.execute('case-1', 'u-admin');
    expect(tx.moderationCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { assignedAdminId: 'admin-1' },
    });
    expect(tx.moderationAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        caseId: 'case-1',
        actionType: ModerationActionType.ASSIGN,
      }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'moderation.assign',
        actorUserId: 'u-admin',
      }),
    });
  });
});

describe('TakeActionUseCase', () => {
  let useCase: TakeActionUseCase;
  let repo: { findAdminByUserId: jest.Mock; findCaseById: jest.Mock };
  let prisma: { $transaction: jest.Mock };
  let tx: ReturnType<typeof makeTx>;

  beforeEach(() => {
    tx = makeTx();
    repo = {
      findAdminByUserId: jest.fn().mockResolvedValue(ADMIN),
      findCaseById: jest.fn().mockResolvedValue(STORE_CASE),
    };
    prisma = {
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(tx)),
    };
    useCase = new TakeActionUseCase(
      repo as unknown as ModerationRepository,
      {} as unknown as StoresRepository,
      {} as unknown as SellersRepository,
      prisma as unknown as PrismaService,
    );
  });

  describe('preconditions', () => {
    it('admin не найден → FORBIDDEN', async () => {
      repo.findAdminByUserId.mockResolvedValue(null);
      await expect(useCase.execute('case-1', 'u-admin', { action: 'APPROVE' } as any))
        .rejects.toThrow(/Admin profile not found/);
    });

    it('case не найден → 404', async () => {
      repo.findCaseById.mockResolvedValueOnce(null);
      await expect(useCase.execute('missing', 'u-admin', { action: 'APPROVE' } as any))
        .rejects.toThrow(/not found/);
    });

    it('REJECT без comment → MODERATION_COMMENT_REQUIRED (INV-A02)', async () => {
      await expect(useCase.execute('case-1', 'u-admin', { action: 'REJECT' } as any))
        .rejects.toThrow(/comment is required/);
    });

    it('REJECT с whitespace-only comment → также блокирует', async () => {
      await expect(useCase.execute('case-1', 'u-admin', { action: 'REJECT', comment: '   ' } as any))
        .rejects.toThrow(/comment is required/);
    });

    it('APPROVE без comment → ok (INV-A02 не требует)', async () => {
      await expect(useCase.execute('case-1', 'u-admin', { action: 'APPROVE' } as any))
        .resolves.toBeDefined();
    });
  });

  describe('store entity side effects', () => {
    it('APPROVE store → status=APPROVED + case CLOSED', async () => {
      await useCase.execute('case-1', 'u-admin', { action: 'APPROVE' } as any);
      expect(tx.store.update).toHaveBeenCalledWith({
        where: { id: 'store-1' },
        data: { status: StoreStatus.APPROVED },
      });
      expect(tx.moderationCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { status: ModerationCaseStatus.CLOSED, assignedAdminId: 'admin-1' },
      });
    });

    it('REJECT store → status=REJECTED + case CLOSED + comment', async () => {
      await useCase.execute('case-1', 'u-admin', { action: 'REJECT', comment: 'Logo violates trademark' } as any);
      expect(tx.store.update).toHaveBeenCalledWith({
        where: { id: 'store-1' },
        data: { status: StoreStatus.REJECTED },
      });
      expect(tx.moderationAction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ comment: 'Logo violates trademark' }),
      });
    });

    it('REQUEST_CHANGES → action создан, но case НЕ закрыт + store НЕ обновлён', async () => {
      await useCase.execute('case-1', 'u-admin', { action: 'REQUEST_CHANGES', comment: 'Need more info' } as any);
      expect(tx.moderationCase.update).not.toHaveBeenCalled();
      expect(tx.store.update).not.toHaveBeenCalled();
      expect(tx.moderationAction.create).toHaveBeenCalled();
    });

    it('ESCALATE → case CLOSED, но store НЕ меняется', async () => {
      await useCase.execute('case-1', 'u-admin', { action: 'ESCALATE', comment: 'kicking up' } as any);
      expect(tx.moderationCase.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: ModerationCaseStatus.CLOSED }),
      }));
      expect(tx.store.update).not.toHaveBeenCalled();
    });
  });

  describe('seller entity side effects', () => {
    beforeEach(() => {
      repo.findCaseById.mockResolvedValue(SELLER_CASE);
    });

    it('APPROVE seller → verificationStatus=VERIFIED', async () => {
      await useCase.execute('case-2', 'u-admin', { action: 'APPROVE' } as any);
      expect(tx.seller.update).toHaveBeenCalledWith({
        where: { id: 'seller-1' },
        data: { verificationStatus: SellerVerificationStatus.VERIFIED },
      });
    });

    it('REJECT seller → verificationStatus=REJECTED', async () => {
      await useCase.execute('case-2', 'u-admin', { action: 'REJECT', comment: 'docs invalid' } as any);
      expect(tx.seller.update).toHaveBeenCalledWith({
        where: { id: 'seller-1' },
        data: { verificationStatus: SellerVerificationStatus.REJECTED },
      });
    });
  });

  describe('audit log (INV-A01)', () => {
    it('action содержит lowercase action', async () => {
      await useCase.execute('case-1', 'u-admin', { action: 'APPROVE' } as any);
      expect(tx.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'moderation.approve',
          actorUserId: 'u-admin',
          actorType: 'admin',
          entityType: 'moderation_case',
          entityId: 'case-1',
        }),
      });
    });

    it('payload содержит caseId, subjectType, subjectId, comment', async () => {
      await useCase.execute('case-1', 'u-admin', { action: 'REJECT', comment: 'reason' } as any);
      const payload = tx.auditLog.create.mock.calls[0][0].data.payload;
      expect(payload).toEqual({
        caseId: 'case-1',
        subjectType: 'store',
        subjectId: 'store-1',
        comment: 'reason',
      });
    });
  });
});
