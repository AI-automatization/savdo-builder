/**
 * API-RBAC-MICRO-PERMISSIONS-001: матрица разрешений для admin-ролей.
 *
 * Семантика permissions: `<resource>:<action>` (например `user:suspend`,
 * `order:refund`). Wildcard:
 *   - `*`         — полный доступ
 *   - `user:*`    — все действия над user
 *   - `*:read`    — read любого ресурса
 *
 * Дизайн: матрица здесь, а не в DB, чтобы изменения проходили через PR-review
 * (security-чувствительная вещь). Если в будущем понадобится пер-юзер
 * override — добавить колонку `AdminUser.permissions: string[]` поверх роли.
 */
export const ADMIN_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: [
    'user:*',
    'store:*',
    'product:*',
    'order:*',
    'moderation:*',
    'broadcast:*',
    'audit:read',
    'media:*',
    'seller:*',
    'category:*',
    'db:*',
    'system:*',
    'analytics:read',
    'refund:*',
    // admin:* НЕ выдаётся обычному admin — управление admin-юзерами только super_admin.
  ],
  moderator: [
    'moderation:*',
    'store:moderate',
    'store:read',
    'store:suspend',
    'store:unsuspend',
    'product:moderate',
    'product:read',
    'product:hide',
    'product:restore',
    'user:read',
    'audit:read',
    'category:moderate',
    'category:read',
    'media:read',
  ],
  support: [
    'user:read',
    'order:read',
    'order:cancel',
    'chat:read',
    'audit:read',
    'store:read',
    'category:read',
    'media:read',
  ],
  finance: [
    'order:*',
    'refund:*',
    'analytics:read',
    'audit:read',
    'store:read',
    'user:read',
    'media:read',
  ],
  read_only: ['*:read'],
};

/**
 * SEC-ADMIN-ACCESS-MODEL стадия B: роли, которым разрешён вход в savdo-admin.
 * `super_admin` = владелец, `admin` = разработчик. Остальные роли
 * (moderator/support/finance/read_only) — резерв, в панель не пускаются.
 * `AdminAccessGuard` отбивает всех не из этого списка.
 */
export const ADMIN_PANEL_ROLES = ['super_admin', 'admin'] as const;

export function canEnterAdminPanel(adminRole: string | null | undefined): boolean {
  return !!adminRole && (ADMIN_PANEL_ROLES as readonly string[]).includes(adminRole);
}

/**
 * Проверка совпадает ли требуемое разрешение хотя бы с одним из выданных роли.
 * Логика wildcard:
 *  - `*`        → matches anything
 *  - `user:*`   → matches `user:read`, `user:suspend`, …
 *  - `*:read`   → matches `user:read`, `order:read`, …
 *  - точное совпадение
 */
export function hasAdminPermission(
  rolePermissions: string[],
  required: string,
): boolean {
  for (const p of rolePermissions) {
    if (p === '*') return true;
    if (p === required) return true;
    if (p.endsWith(':*')) {
      const prefix = p.slice(0, -1); // 'user:'
      if (required.startsWith(prefix)) return true;
    }
    if (p.startsWith('*:')) {
      const suffix = p.slice(1); // ':read'
      if (required.endsWith(suffix)) return true;
    }
  }
  return false;
}

/**
 * Получить permissions для adminRole. Возвращает [] если роль неизвестна
 * (fail-closed).
 */
export function getAdminPermissions(adminRole: string | null | undefined): string[] {
  if (!adminRole) return [];
  return ADMIN_PERMISSIONS[adminRole] ?? [];
}
