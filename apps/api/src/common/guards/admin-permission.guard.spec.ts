/**
 * Тесты для `AdminPermissionGuard`.
 * Критично: проверяет endpoint-level разрешения для admin-ролей.
 * Любой баг даёт privilege escalation (например support выдаёт refund).
 */
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminPermissionGuard } from './admin-permission.guard';
import { ADMIN_PERMISSION_KEY } from '../decorators/admin-permission.decorator';
import { PrismaService } from '../../database/prisma.service';

function makeContext(user: Record<string, unknown> | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => () => {},
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('AdminPermissionGuard', () => {
  let guard: AdminPermissionGuard;
  let reflector: jest.Mocked<Reflector>;
  let prisma: { adminUser: { findUnique: jest.Mock } };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    prisma = {
      adminUser: { findUnique: jest.fn() },
    };
    guard = new AdminPermissionGuard(reflector, prisma as unknown as PrismaService);
  });

  describe('endpoints без @AdminPermission', () => {
    it('пропускает если декоратора нет (legacy compat)', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN' });
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });
  });

  describe('endpoints с @AdminPermission', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue('user:suspend');
    });

    it('БРОСАЕТ 401 если user отсутствует', async () => {
      const ctx = makeContext(undefined);
      await expect(guard.canActivate(ctx)).rejects.toThrow(/Authentication required/);
    });

    it('пропускает super_admin (через JWT.adminRole)', async () => {
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN', adminRole: 'super_admin' });
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      // super_admin = '*' → DB lookup не нужен
      expect(prisma.adminUser.findUnique).not.toHaveBeenCalled();
    });

    it('пропускает admin для user:suspend', async () => {
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN', adminRole: 'admin' });
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('БРОСАЕТ 403 для support — нет user:suspend', async () => {
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN', adminRole: 'support' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(/Admin permission 'user:suspend' required/);
    });

    it('БРОСАЕТ 403 для read_only — у него только *:read', async () => {
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN', adminRole: 'read_only' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(/Admin permission/);
    });
  });

  describe('legacy JWT без adminRole — DB fallback', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue('user:read');
    });

    it('делает DB-lookup если JWT.adminRole отсутствует', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ adminRole: 'admin' });
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN' });
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(prisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        select: { adminRole: true },
      });
    });

    it('БРОСАЕТ 403 если user не AdminUser в DB', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null);
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(/Admin permission/);
    });
  });

  describe('реальные сценарии privilege escalation', () => {
    it('finance НЕ может suspend user (только refund + analytics + read)', async () => {
      reflector.getAllAndOverride.mockReturnValue('user:suspend');
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN', adminRole: 'finance' });
      await expect(guard.canActivate(ctx)).rejects.toThrow();
    });

    it('moderator НЕ может delete product (только moderate)', async () => {
      reflector.getAllAndOverride.mockReturnValue('product:delete');
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN', adminRole: 'moderator' });
      await expect(guard.canActivate(ctx)).rejects.toThrow();
    });

    it('admin НЕ может создавать других admin (только super_admin)', async () => {
      reflector.getAllAndOverride.mockReturnValue('admin:create');
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN', adminRole: 'admin' });
      await expect(guard.canActivate(ctx)).rejects.toThrow();
    });

    it('super_admin МОЖЕТ создавать admin', async () => {
      reflector.getAllAndOverride.mockReturnValue('admin:create');
      const ctx = makeContext({ sub: 'u1', role: 'ADMIN', adminRole: 'super_admin' });
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });
  });

  describe('integration с @AdminPermission decorator', () => {
    it('reflector вызван с handler и class scope', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      await guard.canActivate(makeContext({ sub: 'u1' }));
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        ADMIN_PERMISSION_KEY,
        expect.any(Array),
      );
    });
  });
});
