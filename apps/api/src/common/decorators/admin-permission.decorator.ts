import { SetMetadata } from '@nestjs/common';

export const ADMIN_PERMISSION_KEY = 'adminPermission';

/**
 * API-RBAC-MICRO-PERMISSIONS-001: помечает endpoint требуемым разрешением.
 *
 * Использование:
 *   @AdminPermission('user:suspend')
 *   @Post('users/:id/suspend')
 *   async suspendUser(...) { ... }
 *
 * `AdminPermissionGuard` читает метаданные и проверяет наличие разрешения
 * у adminRole. Если декоратора нет — guard пропускает (fallback на @Roles).
 *
 * Список доступных permissions: `apps/api/src/common/constants/admin-permissions.ts`.
 */
export const AdminPermission = (permission: string) =>
  SetMetadata(ADMIN_PERMISSION_KEY, permission);
