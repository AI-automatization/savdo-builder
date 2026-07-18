import { IsOptional, IsString, IsIn } from 'class-validator';
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
}
