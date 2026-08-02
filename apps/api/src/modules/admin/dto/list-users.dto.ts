import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(['BUYER', 'SELLER', 'ADMIN'])
  role?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'BLOCKED'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
