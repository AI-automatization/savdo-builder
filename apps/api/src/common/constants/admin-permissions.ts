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

// ─── FEAT-CUSTOM-ROLES-001 ──────────────────────────────────────────────────

/** Базовые роли, зашитые в код (неизменяемы, под PR-review). */
export const BASE_ADMIN_ROLES = [
  'super_admin', 'admin', 'moderator', 'support', 'finance', 'read_only',
] as const;

export function isBaseAdminRole(role: string | null | undefined): boolean {
  return !!role && (BASE_ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Канонический словарь конкретных permissions, которые можно выдать кастомной
 * роли. Сгруппирован по ресурсам. НЕ содержит reserved (см. ниже) — управление
 * админами (`admin:*`), raw DB (`db:*`), system и wildcard `*` кастомным ролям
 * недоступны (защита от эскалации привилегий).
 */
export const ADMIN_PERMISSION_VOCABULARY: string[] = [
  'user:read', 'user:update', 'user:suspend', 'user:impersonate',
  'store:read', 'store:create', 'store:moderate', 'store:suspend', 'store:unsuspend', 'store:archive',
  'product:read', 'product:moderate', 'product:hide', 'product:restore', 'product:delete',
  'order:read', 'order:cancel',
  'moderation:read', 'moderation:moderate',
  'seller:read', 'seller:create', 'seller:verify',
  'category:read', 'category:moderate',
  'media:read', 'media:migrate',
  'broadcast:create',
  'subscription:moderate',
  'analytics:read',
  'refund:create',
  'audit:read',
  'chat:read',
];

/** Reserved-префиксы: эти ресурсы кастомным ролям выдавать нельзя. */
const RESERVED_RESOURCES = ['admin', 'db', 'system'];

/**
 * Можно ли выдать permission кастомной роли: строго из словаря, не reserved,
 * не wildcard. Fail-closed на всё неизвестное.
 */
export function isAssignableCustomPermission(perm: string): boolean {
  if (perm === '*' || perm.includes('*')) return false;
  const resource = perm.split(':')[0];
  if (RESERVED_RESOURCES.includes(resource)) return false;
  return ADMIN_PERMISSION_VOCABULARY.includes(perm);
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
