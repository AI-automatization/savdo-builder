import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const CASE_STATUSES = ['open', 'approved', 'rejected', 'escalated', 'closed'] as const;
export const ENTITY_TYPES = ['store', 'seller', 'product', 'message'] as const;

export class ListCasesDto {
  @IsOptional()
  @IsIn(CASE_STATUSES)
  status?: string;

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
