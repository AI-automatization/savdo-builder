/**
 * Тесты для `AdminUsersManagementUseCase`.
 *
 * Privilege escalation surface — кто может создавать/удалять админов и
 * grant'ить super_admin role. Покрытие:
 *   - validation: валидные роли
 *   - super_admin guard: только super_admin может trigger admin actions
 *   - super_admin escalation guard: только super_admin может grant/revoke super_admin
 *   - self-action protection: нельзя поменять/удалить себя
 *   - happy path для list/create/changeRole/revoke
 */
import { AdminUsersManagementUseCase } from './admin-users-management.use-case';
import { PrismaService } from '../../../database/prisma.service';

const SUPER = { id: 'a-super', userId: 'u-super', adminRole: 'super_admin', isSuperadmin: true };
const MOD   = { id: 'a-mod',   userId: 'u-mod',   adminRole: 'moderator',   isSuperadmin: false };
const ADM   = { id: 'a-adm',   userId: 'u-adm',   adminRole: 'admin',       isSuperadmin: false };

describe('AdminUsersManagementUseCase', () => {
  let useCase: AdminUsersManagementUseCase;
  let prisma: {
    adminUser: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    user:      { findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      adminUser: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockImplementation(async (ops: any[]) => {
        // ops — это array Prisma promises, просто await их по очереди
        return Promise.all(ops);
      }),
    };
    useCase = new AdminUsersManagementUseCase(prisma as unknown as PrismaService);
  });

  describe('list()', () => {
    it('возвращает админов с маппингом полей', async () => {
      prisma.adminUser.findMany.mockResolvedValue([
        {
          id: 'a-1', userId: 'u-1',
          adminRole: 'moderator', isSuperadmin: false, mfaEnabled: true,
          lastLoginAt: new Date('2026-01-01'), lastLoginIp: '1.2.3.4',
          createdAt: new Date('2025-01-01'),
          user: { id: 'u-1', phone: '+998900000001' },
        },
      ]);
      const result = await useCase.list();
      expect(result).toEqual([expect.objectContaining({
        id: 'a-1',
        userId: 'u-1',
        adminRole: 'moderator',
        isSuperadmin: false,
        mfaEnabled: true,
      })]);
    });
  });

  describe('create()', () => {
    it('invalid role → VALIDATION_ERROR', async () => {
      await expect(useCase.create('a-super', '+998900000001', 'hacker' as any))
        .rejects.toThrow(/Invalid role/);
    });

    it('non-superadmin actor → FORBIDDEN', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(MOD);
      await expect(useCase.create('a-mod', '+998900000001', 'moderator'))
        .rejects.toThrow(/Only super_admin can manage admins/);
    });

    it('user (по phone) не найден → 404', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(SUPER);
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(useCase.create('a-super', '+998900000001', 'moderator'))
        .rejects.toThrow(/User with phone .+ not found/);
    });

    it('user уже админ → 400', async () => {
      prisma.adminUser.findUnique.mockImplementation((args: any) => {
        if (args.where.id === 'a-super') return SUPER;
        if (args.where.userId === 'u-1') return { id: 'existing-admin' };
        return null;
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1', phone: '+998900000001' });
      await expect(useCase.create('a-super', '+998900000001', 'moderator'))
        .rejects.toThrow(/already has admin record/);
    });

    it('happy path: super_admin создаёт moderator → User.role=ADMIN + adminUser.create', async () => {
      prisma.adminUser.findUnique.mockImplementation((args: any) => {
        if (args.where.id === 'a-super') return SUPER;
        if (args.where.userId) return null;
        return null;
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1', phone: '+998900000001' });
      prisma.adminUser.create.mockResolvedValue({ id: 'new-admin' });

      const result = await useCase.create('a-super', '+998900000001', 'moderator');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { role: 'ADMIN' },
      });
      expect(prisma.adminUser.create).toHaveBeenCalledWith({
        data: { userId: 'u-1', adminRole: 'moderator', isSuperadmin: false },
      });
      expect(result).toEqual({ id: 'new-admin', userId: 'u-1', phone: '+998900000001', adminRole: 'moderator' });
    });

    it('создание super_admin: isSuperadmin=true', async () => {
      prisma.adminUser.findUnique.mockImplementation((args: any) =>
        args.where.id === 'a-super' ? SUPER : null,
      );
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1', phone: '+998900000001' });
      prisma.adminUser.create.mockResolvedValue({ id: 'new-admin' });

      await useCase.create('a-super', '+998900000001', 'super_admin');
      expect(prisma.adminUser.create).toHaveBeenCalledWith({
        data: { userId: 'u-1', adminRole: 'super_admin', isSuperadmin: true },
      });
    });
  });

  describe('changeRole()', () => {
    it('actor пытается поменять свою роль → VALIDATION_ERROR', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(SUPER);
      await expect(useCase.changeRole('a-super', 'a-super', 'moderator'))
        .rejects.toThrow(/your own role/);
    });

    it('non-super поднимает кого-то до super_admin → FORBIDDEN', async () => {
      prisma.adminUser.findUnique.mockImplementation((args: any) => {
        if (args.where.id === 'a-mod') return MOD;
        return null;
      });
      // ADM был бы трогать с moderator на super_admin — non-super не может
      prisma.adminUser.findUnique.mockResolvedValue(MOD);
      await expect(useCase.changeRole('a-mod', 'a-other', 'super_admin'))
        .rejects.toThrow(/Only super_admin can manage admins/);
    });

    it('target не существует → 404', async () => {
      // actor super, target null
      let call = 0;
      prisma.adminUser.findUnique.mockImplementation(() => {
        call++;
        return call === 1 ? SUPER : null;
      });
      await expect(useCase.changeRole('a-super', 'a-missing', 'moderator'))
        .rejects.toThrow(/Admin not found/);
    });

    it('happy path: super_admin меняет moderator → admin', async () => {
      let call = 0;
      prisma.adminUser.findUnique.mockImplementation(() => {
        call++;
        return call === 1 ? SUPER : MOD;
      });
      prisma.adminUser.update.mockResolvedValue({ id: 'a-mod', adminRole: 'admin' });
      const result = await useCase.changeRole('a-super', 'a-mod', 'admin');
      expect(prisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: 'a-mod' },
        data: { adminRole: 'admin', isSuperadmin: false },
      });
      expect(result).toEqual({ id: 'a-mod', adminRole: 'admin' });
    });
  });

  describe('revoke()', () => {
    it('actor пытается revoke себя → VALIDATION_ERROR', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(SUPER);
      await expect(useCase.revoke('a-super', 'a-super'))
        .rejects.toThrow(/Cannot revoke yourself/);
    });

    it('non-super → FORBIDDEN', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(MOD);
      await expect(useCase.revoke('a-mod', 'a-other'))
        .rejects.toThrow(/Only super_admin/);
    });

    it('non-super не может revoke super_admin', async () => {
      // non-super-admin actor — fail на requireSuperadmin
      prisma.adminUser.findUnique.mockResolvedValue(ADM);
      await expect(useCase.revoke('a-adm', 'a-target'))
        .rejects.toThrow(/Only super_admin/);
    });

    it('target не существует → 404', async () => {
      let call = 0;
      prisma.adminUser.findUnique.mockImplementation(() => {
        call++;
        return call === 1 ? SUPER : null;
      });
      await expect(useCase.revoke('a-super', 'a-missing'))
        .rejects.toThrow(/Admin not found/);
    });

    it('happy path: super_admin revokes moderator → delete + User.role=BUYER в transaction', async () => {
      let call = 0;
      prisma.adminUser.findUnique.mockImplementation(() => {
        call++;
        return call === 1 ? SUPER : MOD;
      });
      const result = await useCase.revoke('a-super', 'a-mod');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });
});
