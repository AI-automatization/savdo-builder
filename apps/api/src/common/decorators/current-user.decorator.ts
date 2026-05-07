import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;       // userId
  role: string;      // UserRole
  sessionId: string;
  storeId?: string;  // populated for SELLER role (optional — absent if store not yet created)

  // API-MFA-NOT-ENFORCED-001: при логине ADMIN с включённым MFA token получает
  // mfaPending=true. MfaEnforcedGuard блокирует все admin endpoints кроме
  // /admin/auth/me, /admin/auth/mfa/login, /admin/auth/mfa/setup, /verify, /disable.
  // После успешного challenge → re-issued token без mfaPending.
  mfaPending?: boolean;

  // API-RBAC-MICRO-PERMISSIONS-001: для ADMIN — конкретная роль из AdminUser.adminRole
  // (super_admin/admin/moderator/support/finance/read_only). Используется
  // AdminPermissionGuard для endpoint-level проверки разрешений.
  adminRole?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
