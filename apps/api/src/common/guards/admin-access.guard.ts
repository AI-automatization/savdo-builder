import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { DomainException } from '../exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { JwtPayload } from '../decorators/current-user.decorator';
import { canEnterAdminPanel, isBaseAdminRole } from '../constants/admin-permissions';

/**
 * SEC-ADMIN-ACCESS-MODEL стадия B — единый entry-gate в savdo-admin.
 *
 * Ставится на все admin-контроллеры ПОСЛЕ JwtAuthGuard/RolesGuard. Проверяет
 * по `AdminUser`:
 *   1. запись существует (у `User` с `role=ADMIN` может не быть `AdminUser`);
 *   2. `isActive` — не отключён (мягкая блокировка);
 *   3. `adminRole ∈ {super_admin, admin}` — moderator/support/finance/read_only
 *      в панель не пускаются.
 *
 * Раньше единственным гейтом был `RolesGuard('ADMIN')` — любой `role=ADMIN`
 * проходил, а admin-эндпоинты без `@AdminPermission` были доступны всем
 * (SEC-AUDIT-05). Этот guard закрывает дыру централизованно.
 *
 * Один indexed-lookup на запрос (`adminUser.userId @unique`) — admin-трафик
 * низкий, накладные расходы пренебрежимы.
 */
@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as JwtPayload | undefined;
    if (!user) {
      throw new DomainException(
        ErrorCode.UNAUTHORIZED,
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const admin = await this.prisma.adminUser.findUnique({
      where: { userId: user.sub },
      select: { adminRole: true, isActive: true },
    });

    if (!admin) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'У вас нет доступа в админ-панель',
        HttpStatus.FORBIDDEN,
      );
    }
    if (!admin.isActive) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Доступ администратора отключён',
        HttpStatus.FORBIDDEN,
      );
    }
    // FEAT-CUSTOM-ROLES-001: базовые панель-роли (super_admin/admin) — сразу;
    // кастомная роль (не базовая, но существует в admin_custom_roles) — тоже
    // пускается (создаётся специально для доступа с ограниченным набором прав).
    let allowed = canEnterAdminPanel(admin.adminRole);
    if (!allowed && admin.adminRole && !isBaseAdminRole(admin.adminRole)) {
      const custom = await this.prisma.adminCustomRole.findUnique({
        where: { name: admin.adminRole },
        select: { id: true },
      });
      allowed = !!custom;
    }
    if (!allowed) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        `Роль '${admin.adminRole}' не имеет доступа в админ-панель`,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
