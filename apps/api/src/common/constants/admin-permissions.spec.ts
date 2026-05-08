/**
 * Тесты для wildcard-логики `hasAdminPermission`.
 * Критично: эта функция определяет может ли admin вызвать endpoint —
 * любой баг даст false positive (доступ выдан там где не должен) или
 * false negative (legitimate admin получает 403).
 */
import {
  hasAdminPermission,
  getAdminPermissions,
  ADMIN_PERMISSIONS,
} from './admin-permissions';

describe('hasAdminPermission', () => {
  describe('exact match', () => {
    it('возвращает true когда required совпадает с одним из выданных', () => {
      expect(hasAdminPermission(['user:read', 'order:read'], 'user:read')).toBe(true);
    });

    it('возвращает false когда required НЕ в списке', () => {
      expect(hasAdminPermission(['user:read'], 'user:suspend')).toBe(false);
    });

    it('возвращает false для пустого списка', () => {
      expect(hasAdminPermission([], 'user:read')).toBe(false);
    });
  });

  describe('wildcard `*` (super_admin)', () => {
    it('matches anything', () => {
      expect(hasAdminPermission(['*'], 'user:read')).toBe(true);
      expect(hasAdminPermission(['*'], 'order:cancel')).toBe(true);
      expect(hasAdminPermission(['*'], 'db:delete')).toBe(true);
    });
  });

  describe('resource wildcard `user:*`', () => {
    it('matches любое action на user', () => {
      expect(hasAdminPermission(['user:*'], 'user:read')).toBe(true);
      expect(hasAdminPermission(['user:*'], 'user:suspend')).toBe(true);
      expect(hasAdminPermission(['user:*'], 'user:impersonate')).toBe(true);
    });

    it('не matches другие resources', () => {
      expect(hasAdminPermission(['user:*'], 'order:read')).toBe(false);
      expect(hasAdminPermission(['user:*'], 'store:approve')).toBe(false);
    });

    it('не matches resource БЕЗ action (edge case)', () => {
      // 'user:*' не должен matches просто 'user' (без двоеточия)
      expect(hasAdminPermission(['user:*'], 'user')).toBe(false);
    });
  });

  describe('action wildcard `*:read` (read_only)', () => {
    it('matches read любого resource', () => {
      expect(hasAdminPermission(['*:read'], 'user:read')).toBe(true);
      expect(hasAdminPermission(['*:read'], 'order:read')).toBe(true);
      expect(hasAdminPermission(['*:read'], 'audit:read')).toBe(true);
    });

    it('не matches non-read actions', () => {
      expect(hasAdminPermission(['*:read'], 'user:suspend')).toBe(false);
      expect(hasAdminPermission(['*:read'], 'order:cancel')).toBe(false);
    });
  });

  describe('multiple permissions', () => {
    it('matches если хотя бы одно совпало', () => {
      const perms = ['user:read', 'order:*', 'audit:read'];
      expect(hasAdminPermission(perms, 'user:read')).toBe(true);
      expect(hasAdminPermission(perms, 'order:cancel')).toBe(true);
      expect(hasAdminPermission(perms, 'audit:read')).toBe(true);
    });

    it('false если ни одно не совпало', () => {
      const perms = ['user:read', 'order:read'];
      expect(hasAdminPermission(perms, 'store:approve')).toBe(false);
    });
  });

  describe('matrix integration — реальные роли', () => {
    it('super_admin может всё', () => {
      const perms = getAdminPermissions('super_admin');
      expect(hasAdminPermission(perms, 'db:delete')).toBe(true);
      expect(hasAdminPermission(perms, 'admin:create')).toBe(true);
    });

    it('admin может всё кроме admin:* (управление admin-юзерами)', () => {
      const perms = getAdminPermissions('admin');
      expect(hasAdminPermission(perms, 'user:suspend')).toBe(true);
      expect(hasAdminPermission(perms, 'store:moderate')).toBe(true);
      expect(hasAdminPermission(perms, 'product:delete')).toBe(true);
      expect(hasAdminPermission(perms, 'refund:create')).toBe(true);
      // admin НЕ может создавать других админов:
      expect(hasAdminPermission(perms, 'admin:create')).toBe(false);
      expect(hasAdminPermission(perms, 'admin:delete')).toBe(false);
    });

    it('moderator может только moderate + read', () => {
      const perms = getAdminPermissions('moderator');
      expect(hasAdminPermission(perms, 'store:moderate')).toBe(true);
      expect(hasAdminPermission(perms, 'product:hide')).toBe(true);
      expect(hasAdminPermission(perms, 'user:read')).toBe(true);
      // НЕ может:
      expect(hasAdminPermission(perms, 'user:suspend')).toBe(false);
      expect(hasAdminPermission(perms, 'order:cancel')).toBe(false);
      expect(hasAdminPermission(perms, 'refund:create')).toBe(false);
    });

    it('support может read + cancel order', () => {
      const perms = getAdminPermissions('support');
      expect(hasAdminPermission(perms, 'user:read')).toBe(true);
      expect(hasAdminPermission(perms, 'order:read')).toBe(true);
      expect(hasAdminPermission(perms, 'order:cancel')).toBe(true);
      // НЕ может:
      expect(hasAdminPermission(perms, 'user:suspend')).toBe(false);
      expect(hasAdminPermission(perms, 'product:delete')).toBe(false);
      expect(hasAdminPermission(perms, 'refund:create')).toBe(false);
    });

    it('finance может всё на orders + refunds + read остальное', () => {
      const perms = getAdminPermissions('finance');
      expect(hasAdminPermission(perms, 'order:cancel')).toBe(true);
      expect(hasAdminPermission(perms, 'refund:create')).toBe(true);
      expect(hasAdminPermission(perms, 'analytics:read')).toBe(true);
      expect(hasAdminPermission(perms, 'user:read')).toBe(true);
      // НЕ может:
      expect(hasAdminPermission(perms, 'user:suspend')).toBe(false);
      expect(hasAdminPermission(perms, 'product:delete')).toBe(false);
    });

    it('read_only может только *:read', () => {
      const perms = getAdminPermissions('read_only');
      expect(hasAdminPermission(perms, 'user:read')).toBe(true);
      expect(hasAdminPermission(perms, 'order:read')).toBe(true);
      expect(hasAdminPermission(perms, 'audit:read')).toBe(true);
      // НЕ может ничего write:
      expect(hasAdminPermission(perms, 'user:suspend')).toBe(false);
      expect(hasAdminPermission(perms, 'order:cancel')).toBe(false);
      expect(hasAdminPermission(perms, 'refund:create')).toBe(false);
    });
  });
});

describe('getAdminPermissions', () => {
  it('возвращает permissions для роли', () => {
    expect(getAdminPermissions('super_admin')).toEqual(['*']);
  });

  it('возвращает [] для неизвестной роли (fail-closed)', () => {
    expect(getAdminPermissions('hacker_role')).toEqual([]);
  });

  it('возвращает [] для null/undefined', () => {
    expect(getAdminPermissions(null)).toEqual([]);
    expect(getAdminPermissions(undefined)).toEqual([]);
  });

  it('matrix содержит все ожидаемые роли', () => {
    expect(Object.keys(ADMIN_PERMISSIONS)).toEqual(
      expect.arrayContaining(['super_admin', 'admin', 'moderator', 'support', 'finance', 'read_only']),
    );
  });
});
