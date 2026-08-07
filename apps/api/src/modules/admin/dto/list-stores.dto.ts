import { IsOptional, IsString, IsIn, IsBooleanString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListStoresDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ARCHIVED'])
  status?: string;

  // PERF-API-001: серверный поиск по name/slug.
  @IsOptional()
  @IsString()
  search?: string;

  // ADMIN-STORE-VISIBILITY-001: 'true' — только видимые на storefront,
  // 'false' — только скрытые (isPublic=false), без значения — все.
  @IsOptional()
  @IsBooleanString()
  isPublic?: string;
}
