import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Базовый DTO для cursor-less pagination (page/limit).
 * Раньше эти поля копировались в каждом `list-*.dto.ts` — теперь наследуй вместо копи-пасты.
 * См. DRY-аудит 2026-06-01 (DUP-004).
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
