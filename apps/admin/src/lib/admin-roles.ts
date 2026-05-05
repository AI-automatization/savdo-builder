export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support' | 'read_only'

export const ROLE_OPTIONS: { value: AdminRole; label: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin',  description: 'Полный доступ + управление администраторами' },
  { value: 'admin',       label: 'Admin',        description: 'Все операции, кроме управления админами' },
  { value: 'moderator',   label: 'Модератор',    description: 'Модерация магазинов, товаров, чатов' },
  { value: 'support',     label: 'Поддержка',    description: 'Чаты, жалобы, ответы пользователям' },
  { value: 'read_only',   label: 'Read-only',    description: 'Только чтение метрик и таблиц' },
]

export const ROLE_BADGE: Record<AdminRole, { bg: string; text: string; label: string }> = {
  super_admin: { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', label: 'Super Admin' },
  admin:       { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: 'Admin' },
  moderator:   { bg: 'rgba(129,140,248,0.12)', text: '#818CF8', label: 'Модератор' },
  support:     { bg: 'rgba(34,197,94,0.12)',  text: '#22C55E', label: 'Поддержка' },
  read_only:   { bg: 'rgba(148,163,184,0.10)', text: '#94A3B8', label: 'Read-only' },
}

export function roleLabel(role: string): string {
  return ROLE_BADGE[role as AdminRole]?.label ?? role
}
