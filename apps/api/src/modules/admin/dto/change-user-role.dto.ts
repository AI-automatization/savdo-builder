import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * HYBRID-4: смена дефолтного контекста (роли) пользователя из админки.
 *
 * Допускаем только BUYER|SELLER. ADMIN сознательно НЕ разрешён — эскалация в
 * админы идёт только через admin-creation flow (super_admin), иначе это дыра
 * привилегий через обычный user:update.
 *
 * Семантика гибридной модели (ADR 2026-06-30): role = активный/дефолтный
 * контекст, а не эксклюзивная роль. Смена non-destructive — профили buyer/seller
 * и магазин сохраняются.
 */
export class ChangeUserRoleDto {
  @IsIn(['BUYER', 'SELLER'])
  role: 'BUYER' | 'SELLER';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
