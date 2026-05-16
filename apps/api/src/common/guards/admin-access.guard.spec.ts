/**
 * Тесты для `AdminAccessGuard` (SEC-ADMIN-ACCESS-MODEL стадия B).
 * Критично: единый entry-gate в savdo-admin. Любой false-positive = доступ
 * для отключённого админа или роли вне {super_admin, admin}.
 */
import { ExecutionContext } from '@nestjs/common';
import { AdminAccessGuard } from './admin-access.guard';
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

describe('AdminAccessGuard', () => {
  let guard: AdminAccessGuard;
  let prisma: { adminUser: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { adminUser: { findUnique: jest.fn() } };
    guard = new AdminAccessGuard(prisma as unknown as PrismaService);
  });

  it('БРОСАЕТ 401 если нет user (не аутентифицирован)', async () => {
    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(
      /Authentication required/,
    );
  });

  it('БРОСАЕТ 403 если у user нет записи AdminUser', async () => {
    prisma.adminUser.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(makeContext({ sub: 'u1' }))).rejects.toThrow(
      /нет доступа/,
    );
  });

  it('БРОСАЕТ 403 если AdminUser отключён (isActive=false)', async () => {
    prisma.adminUser.findUnique.mockResolvedValue({ adminRole: 'admin', isActive: false });
    await expect(guard.canActivate(makeContext({ sub: 'u1' }))).rejects.toThrow(
      /отключён/,
    );
  });

  it('БРОСАЕТ 403 для роли вне {super_admin, admin} (read_only)', async () => {
    prisma.adminUser.findUnique.mockResolvedValue({ adminRole: 'read_only', isActive: true });
    await expect(guard.canActivate(makeContext({ sub: 'u1' }))).rejects.toThrow(
      /не имеет доступа/,
    );
  });

  it.each(['moderator', 'support', 'finance'])(
    'БРОСАЕТ 403 для резервной роли %s',
    async (role) => {
      prisma.adminUser.findUnique.mockResolvedValue({ adminRole: role, isActive: true });
      await expect(guard.canActivate(makeContext({ sub: 'u1' }))).rejects.toThrow(
        /не имеет доступа/,
      );
    },
  );

  it('ПРОПУСКАЕТ super_admin + isActive', async () => {
    prisma.adminUser.findUnique.mockResolvedValue({ adminRole: 'super_admin', isActive: true });
    await expect(guard.canActivate(makeContext({ sub: 'u1' }))).resolves.toBe(true);
  });

  it('ПРОПУСКАЕТ admin + isActive', async () => {
    prisma.adminUser.findUnique.mockResolvedValue({ adminRole: 'admin', isActive: true });
    await expect(guard.canActivate(makeContext({ sub: 'u1' }))).resolves.toBe(true);
  });

  it('lookup идёт по userId из JWT (sub)', async () => {
    prisma.adminUser.findUnique.mockResolvedValue({ adminRole: 'admin', isActive: true });
    await guard.canActivate(makeContext({ sub: 'user-42' }));
    expect(prisma.adminUser.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-42' } }),
    );
  });
});
