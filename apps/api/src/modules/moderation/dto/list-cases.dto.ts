import { IsIn, IsOptional } from 'class-validator';
import { ModerationCaseStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

// Соответствует ModerationCaseStatus enum в schema.prisma после DB-AUDIT-002 part 3.
// Frontend должен слать UPPERCASE (OPEN/IN_REVIEW/CLOSED) — старые legacy
// 'open'/'closed' lowercase больше не принимаются.
export const CASE_STATUSES = Object.values(ModerationCaseStatus);
export const ENTITY_TYPES = ['store', 'seller', 'product', 'message'] as const;

export class ListCasesDto extends PaginationDto {
  @IsOptional()
  @IsIn(CASE_STATUSES)
  status?: ModerationCaseStatus;

  @IsOptional()
  @IsIn(ENTITY_TYPES)
  entityType?: string;
}
