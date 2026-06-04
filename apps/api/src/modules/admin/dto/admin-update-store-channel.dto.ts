import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * P1-1 (audit-2026-06-04): admin задаёт Telegram-канал магазина.
 *
 * Семантика (PATCH):
 *   - `undefined` (ключ отсутствует) → не трогать колонку.
 *   - `""` (пустая строка) → очистить (записать NULL).
 *   - значение → нормализуется в use-case (см. нормализацию `@username`).
 *
 * Принимаемые форматы для `telegramChannelId`:
 *   • `@my_channel`
 *   • `my_channel`           (без @)
 *   • `https://t.me/my_channel`
 *   • `t.me/my_channel`
 *   • `-1001234567890`       (числовой chat_id супергруппы/канала)
 *
 * Любая форма нормализуется до `@my_channel` либо до числового id "как есть".
 */
export class AdminUpdateStoreChannelDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  telegramChannelId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  telegramChannelTitle?: string;
}
