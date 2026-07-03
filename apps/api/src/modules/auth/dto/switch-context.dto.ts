import { IsIn } from 'class-validator';

/**
 * HYBRID-1 (ADR 2026-06-30 «Гибридная модель ролей»): переключение активного
 * контекста аккаунта между покупателем и продавцом без перелогина.
 *
 * SELLER требует наличие магазина (иначе 400) — «нет магазина → нельзя в
 * режим продавца». BUYER доступен всегда (buyer-профиль гарантируется upsert).
 */
export class SwitchContextDto {
  @IsIn(['BUYER', 'SELLER'])
  context: 'BUYER' | 'SELLER';
}
