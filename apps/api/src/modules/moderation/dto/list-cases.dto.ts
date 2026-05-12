import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ModerationCaseStatus } from '@prisma/client';

// Соответствует ModerationCaseStatus enum в schema.prisma после DB-AUDIT-002 part 3.
// Frontend должен слать UPPERCASE (OPEN/IN_REVIEW/CLOSED) — старые legacy
// 'open'/'closed' lowercase больше не принимаются.
export const CASE_STATUSES = Object.values(ModerationCaseStatus);
export const ENTITY_TYPES = ['store', 'seller', 'product', 'message'] as const;

export class ListCasesDto {
  @IsOptional()
  @IsIn(CASE_STATUSES)
  status?: ModerationCaseStatus;

  @IsOptional()
  @IsIn(ENTITY_TYPES)
  entityType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
