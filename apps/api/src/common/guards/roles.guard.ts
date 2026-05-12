import { Injectable, CanActivate, ExecutionContext, HttpStatus, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { DomainException } from '../exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

/**
 * API-ROLES-GUARD-ADMIN-BYPASS-001 (SEC-003 HIGH-02):
 * Старая версия `RolesGuard` имела безусловный `if user.role === 'ADMIN' return true`.
 * Это позволяло админу обращаться к buyer/seller endpoints от чужого имени и менять
 * статусы заказов через `actorRole=SELLER/BUYER`. Теперь bypass требует явный декоратор.
 *
 * Если admin реально должен ходить через seller/buyer route (редко) — пометьте
 * handler `@AllowAdminBypass()`. По умолчанию admin получает 403 на @Roles('SELLER').
 * Свои admin-routes идут через `@Roles('ADMIN')` — ничего не ломается.
 */
const ADMIN_BYPASS_KEY = 'allowAdminBypass';
export const AllowAdminBypass = () => SetMetadata(ADMIN_BYPASS_KEY, true);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new DomainException(ErrorCode.UNAUTHORIZED, 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // ADMIN bypass — только если handler явно помечен @AllowAdminBypass().
    if (user.role === 'ADMIN') {
      const adminBypass = this.reflector.getAllAndOverride<boolean>(ADMIN_BYPASS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (adminBypass) return true;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Insufficient permissions', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
