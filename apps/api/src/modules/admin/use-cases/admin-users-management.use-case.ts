import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { AuditService } from '../../audit/audit.service';
import { isBaseAdminRole, isAssignableCustomPermission } from '../../../common/constants/admin-permissions';

const VALID_ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'support', 'finance', 'read_only'] as const;
export type AdminRoleType = typeof VALID_ADMIN_ROLES[number];

@Injectable()
export class AdminUsersManagementUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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
    await this.assertAssignableRole(adminRole);

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
    await this.assertAssignableRole(newRole);

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

  // Роль назначаема, если это базовая роль ИЛИ существующая кастомная роль.
  private async assertAssignableRole(role: string): Promise<void> {
    if (isBaseAdminRole(role)) return;
    const custom = await this.prisma.adminCustomRole.findUnique({ where: { name: role } });
    if (custom) return;
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      `Invalid role '${role}'. Base: ${VALID_ADMIN_ROLES.join(', ')} или существующая кастомная роль.`,
      HttpStatus.BAD_REQUEST,
    );
  }

  // ── FEAT-CUSTOM-ROLES-001: CRUD кастомных ролей (только super_admin) ────────

  async listCustomRoles() {
    return this.prisma.adminCustomRole.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createCustomRole(actorAdminId: string, nameRaw: string, label: string, permissions: string[]) {
    const actor = await this.requireSuperadmin(actorAdminId);
    const name = this.normalizeRoleName(nameRaw);

    if (isBaseAdminRole(name)) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, `Имя '${name}' занято базовой ролью`, HttpStatus.BAD_REQUEST);
    }
    if (await this.prisma.adminCustomRole.findUnique({ where: { name } })) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, `Роль '${name}' уже существует`, HttpStatus.BAD_REQUEST);
    }
    this.validateCustomPermissions(permissions);
    if (!label?.trim()) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'label обязателен', HttpStatus.BAD_REQUEST);
    }

    const role = await this.prisma.adminCustomRole.create({
      data: { name, label: label.trim(), permissions, createdByAdminId: actorAdminId },
    });
    await this.audit.write({
      actorUserId: actor.userId,
      action: 'CUSTOM_ROLE_CREATED',
      entityType: 'AdminCustomRole',
      entityId: role.id,
      payload: { name, label: role.label, permissions },
    });
    return role;
  }

  async updateCustomRole(actorAdminId: string, id: string, data: { label?: string; permissions?: string[] }) {
    const actor = await this.requireSuperadmin(actorAdminId);
    const role = await this.prisma.adminCustomRole.findUnique({ where: { id } });
    if (!role) throw new DomainException(ErrorCode.NOT_FOUND, 'Роль не найдена', HttpStatus.NOT_FOUND);

    if (data.permissions) this.validateCustomPermissions(data.permissions);

    const updated = await this.prisma.adminCustomRole.update({
      where: { id },
      data: {
        ...(data.label !== undefined ? { label: data.label.trim() } : {}),
        ...(data.permissions !== undefined ? { permissions: data.permissions } : {}),
      },
    });
    await this.audit.write({
      actorUserId: actor.userId,
      action: 'CUSTOM_ROLE_UPDATED',
      entityType: 'AdminCustomRole',
      entityId: id,
      payload: { name: role.name, before: { label: role.label, permissions: role.permissions }, after: { label: updated.label, permissions: updated.permissions } },
    });
    return updated;
  }

  async deleteCustomRole(actorAdminId: string, id: string) {
    const actor = await this.requireSuperadmin(actorAdminId);
    const role = await this.prisma.adminCustomRole.findUnique({ where: { id } });
    if (!role) throw new DomainException(ErrorCode.NOT_FOUND, 'Роль не найдена', HttpStatus.NOT_FOUND);

    const assigned = await this.prisma.adminUser.count({ where: { adminRole: role.name } });
    if (assigned > 0) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Роль назначена ${assigned} админам — сначала переназначьте их`,
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.adminCustomRole.delete({ where: { id } });
    await this.audit.write({
      actorUserId: actor.userId,
      action: 'CUSTOM_ROLE_DELETED',
      entityType: 'AdminCustomRole',
      entityId: id,
      payload: { name: role.name, label: role.label },
    });
    return { ok: true };
  }

  private validateCustomPermissions(permissions: string[]): void {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'permissions обязательны (непустой массив)', HttpStatus.BAD_REQUEST);
    }
    const bad = permissions.filter((p) => !isAssignableCustomPermission(p));
    if (bad.length) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        `Недопустимые permissions: ${bad.join(', ')}. Reserved (admin/db/system/*) и неизвестные запрещены.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private normalizeRoleName(raw: string): string {
    const name = (raw ?? '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (name.length < 2) {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'Имя роли: минимум 2 символа [a-z0-9_]', HttpStatus.BAD_REQUEST);
    }
    return name;
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
