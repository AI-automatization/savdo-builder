import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { DomainException } from '../exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { JwtPayload } from '../decorators/current-user.decorator';
import { ADMIN_PERMISSION_KEY } from '../decorators/admin-permission.decorator';
import {
  getAdminPermissions,
  hasAdminPermission,
} from '../constants/admin-permissions';

/**
 * API-RBAC-MICRO-PERMISSIONS-001: проверяет endpoint-level разрешение.
 *
 * Применяется ПОСЛЕ JwtAuthGuard и RolesGuard. Если на endpoint нет
 * `@AdminPermission(...)` метаданных — guard пропускает (legacy compatibility).
 *
 * Для проверки нужен `adminRole`. Берём из JWT (`payload.adminRole`),
 * который выставляется при login (см. login flows). Это даёт O(1) проверку
 * без DB hit на каждый запрос. Изменение adminRole инвалидируется на
 * следующем refresh (acceptable — admin-роль меняется редко).
 *
 * Если в JWT нет adminRole (старые токены до этого фикса) → fallback на DB
 * lookup. После переходного периода можно убрать.
 */
@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string | undefined>(
      ADMIN_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true; // нет декоратора → не проверяем

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as JwtPayload | undefined;
    if (!user) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    let adminRole = user.adminRole;
    if (!adminRole) {
      // Fallback: legacy JWT без adminRole. Дёргаем DB.
      const admin = await this.prisma.adminUser.findUnique({
        where: { userId: user.sub },
        select: { adminRole: true },
      });
      adminRole = admin?.adminRole;
    }

    const perms = getAdminPermissions(adminRole);
    if (!hasAdminPermission(perms, required)) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        `Admin permission '${required}' required (your role: ${adminRole ?? 'none'})`,
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
