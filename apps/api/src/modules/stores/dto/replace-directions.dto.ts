import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

/**
 * Body для PUT /stores/directions: список GlobalCategory ids,
 * которые продавец хочет привязать к своему магазину как направления.
 *
 * Хард-лимит 10 — защита от спама и cleanup миграция (старые store'ы могли
 * иметь больше). Каждый id должен быть строкой; реальная валидация
 * существования категорий выполняется в контроллере (whitelist via DB).
 */
export class ReplaceDirectionsDto {
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  ids!: string[];
}
