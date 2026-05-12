import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

const VALID_ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'support', 'finance', 'read_only'] as const;
export type AdminRoleType = typeof VALID_ADMIN_ROLES[number];

@Injectable()
export class AdminUsersManagementUseCase {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /admin/admins ──────────────────────────────────────────────
  async list() {
    const admins = await this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, phone: true, telegramId: true, createdAt: true } },
      },
    });
    return admins.map((a: any) => ({
      id: a.id,
      userId: a.userId,
      adminRole: a.adminRole,
      isSuperadmin: a.isSuperadmin,
      mfaEnabled: a.mfaEnabled,
      lastLoginAt: a.lastLoginAt,
      lastLoginIp: a.lastLoginIp,
      createdAt: a.createdAt,
      user: a.user,
    }));
  }

  // ── POST /admin/admins ─────────────────────────────────────────────
  // body { phone, adminRole }
  async create(actorAdminId: string, phone: string, adminRole: string) {
    this.requireValidRole(adminRole);

    const actor = await this.requireSuperadmin(actorAdminId);

    // Только super_admin может создавать новых super_admin
    if (adminRole === 'super_admin' && !actor.isSuperadmin && actor.adminRole !== 'super_admin') {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Only super_admin can grant super_admin role', HttpStatus.FORBIDDEN);
    }

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new DomainException(ErrorCode.NOT_FOUND, `User with phone ${phone} not found — they must register first`, HttpStatus.NOT_FOUND);
    }

    const existing = await this.prisma.adminUser.findUnique({ where: { userId: user.id } });
    if (existing) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'User already has admin record', HttpStatus.BAD_REQUEST);
    }

    // Поднимаем User.role до ADMIN (для JWT)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });

    const created = await this.prisma.adminUser.create({
      data: {
        userId: user.id,
        adminRole,
        isSuperadmin: adminRole === 'super_admin',
      },
    });

    return { id: created.id, userId: user.id, phone, adminRole };
  }

  // ── PATCH /admin/admins/:id/role ───────────────────────────────────
  async changeRole(actorAdminId: string, targetAdminId: string, newRole: string) {
    this.requireValidRole(newRole);

    const actor = await this.requireSuperadmin(actorAdminId);

    if (actorAdminId === targetAdminId) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'Cannot change your own role', HttpStatus.BAD_REQUEST);
    }

    const target = await this.prisma.adminUser.findUnique({ where: { id: targetAdminId } });
    if (!target) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Admin not found', HttpStatus.NOT_FOUND);
    }

    // Только super_admin может grant/revoke super_admin
    if ((newRole === 'super_admin' || target.adminRole === 'super_admin') && actor.adminRole !== 'super_admin') {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Only super_admin can manage super_admin role', HttpStatus.FORBIDDEN);
    }

    const updated = await this.prisma.adminUser.update({
      where: { id: targetAdminId },
      data: { adminRole: newRole, isSuperadmin: newRole === 'super_admin' },
    });

    return { id: updated.id, adminRole: updated.adminRole };
  }

  // ── DELETE /admin/admins/:id ───────────────────────────────────────
  async revoke(actorAdminId: string, targetAdminId: string) {
    const actor = await this.requireSuperadmin(actorAdminId);

    if (actorAdminId === targetAdminId) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'Cannot revoke yourself', HttpStatus.BAD_REQUEST);
    }

    const target = await this.prisma.adminUser.findUnique({ where: { id: targetAdminId } });
    if (!target) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Admin not found', HttpStatus.NOT_FOUND);
    }

    if (target.adminRole === 'super_admin' && actor.adminRole !== 'super_admin') {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Only super_admin can revoke super_admin', HttpStatus.FORBIDDEN);
    }

    // Удаляем admin-record + понижаем User.role
    await this.prisma.$transaction([
      this.prisma.adminUser.delete({ where: { id: targetAdminId } }),
      this.prisma.user.update({ where: { id: target.userId }, data: { role: 'BUYER' } }),
    ]);

    return { ok: true };
  }

  private requireValidRole(role: string): asserts role is AdminRoleType {
    if (!VALID_ADMIN_ROLES.includes(role as AdminRoleType)) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Invalid role. Allowed: ${VALID_ADMIN_ROLES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async requireSuperadmin(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new DomainException(ErrorCode.ADMIN_NOT_FOUND, 'Admin not found', HttpStatus.FORBIDDEN);
    }
    if (admin.adminRole !== 'super_admin' && !admin.isSuperadmin) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Only super_admin can manage admins', HttpStatus.FORBIDDEN);
    }
    return admin;
  }
}
